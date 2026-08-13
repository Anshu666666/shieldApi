import time
import re
import os
from collections import defaultdict
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from packages.shared.redis_manager import RedisManager

# State for Filter 3 (Sliding Window)
TIME_WINDOW_SEC = 10
ERROR_THRESHOLD = 50

class LogPipelineHandler(FileSystemEventHandler):
    def __init__(self, log_path):
        self.log_path = log_path
        self.file_position = 0
        self.ip_error_tracker = defaultdict(list)
        
        # Move to the end of the file on startup so we only read new traffic
        if os.path.exists(self.log_path):
            with open(self.log_path, 'r') as f:
                f.seek(0, os.SEEK_END)
                self.file_position = f.tell()

    def on_modified(self, event):
        if event.src_path == self.log_path:
            self.process_new_logs()

    def process_new_logs(self):
        # FILTER 1: The Listener (Reads only the newly added lines)
        with open(self.log_path, 'r') as f:
            f.seek(self.file_position)
            lines = f.readlines()
            self.file_position = f.tell()

        for line in lines:
            self.filter2_parse(line)

    def filter2_parse(self, log_line):
        # FILTER 2: The Parser (Extracts IP and Status Code)
        # Matches format: 192.168.1.5 - - [Date] "GET /api HTTP/1.1" 404
        match = re.search(r'^(\d+\.\d+\.\d+\.\d+).*\s(\d{3})\s', log_line)
        if match:
            ip = match.group(1)
            status_code = int(match.group(2))
            
            # Only care about unauthorized or server errors
            if status_code in [401, 403, 404, 500]:
                self.filter3_detect(ip)

    def filter3_detect(self, ip):
        # FILTER 3: The Detector (Sliding Window Algorithm)
        current_time = time.time()
        self.ip_error_tracker[ip].append(current_time)

        # Remove old errors that fall outside the 10-second window
        self.ip_error_tracker[ip] = [t for t in self.ip_error_tracker[ip] if current_time - t <= TIME_WINDOW_SEC]

        # Check if the threshold is breached
        if len(self.ip_error_tracker[ip]) > ERROR_THRESHOLD:
            self.filter4_block(ip)

    def filter4_block(self, ip):
        # FILTER 4: The Blocker (Push to Redis)
        is_already_blocked = RedisManager.is_ip_blocked(ip)
        if not is_already_blocked:
            # Block for 24 hours (86400 seconds)
            RedisManager.block_ip(ip, ttl_seconds=86400)
            print(f"🚨 THREAT DETECTED: IP {ip} exceeded 50 errors in 10s. Blocked in Redis with 24h TTL!")

if __name__ == "__main__":
    # Fetch log path from Docker environment
    log_file = os.getenv("LOG_FILE_PATH", "/var/log/shieldapi/access.log")
    log_dir = os.path.dirname(log_file)

    # Ensure directory exists for watchdog to monitor
    os.makedirs(log_dir, exist_ok=True)
    if not os.path.exists(log_file):
        open(log_file, 'w').close()

    print("🛡️ ShieldAPI Anomaly Guardian Pipeline Active...")
    print(f"📡 Listening to {log_file} for malicious traffic...")

    event_handler = LogPipelineHandler(log_file)
    observer = Observer()
    observer.schedule(event_handler, path=log_dir, recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
