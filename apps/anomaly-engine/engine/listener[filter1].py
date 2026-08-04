import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class LogHandler(FileSystemEventHandler):
    # This function runs automatically whenever a file is modified
    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith("access.log"):
            print(f"[Filter 1] Traffic detected! Reading raw log from: {event.src_path}")
            # Later , afterwards, we will send this data to Filter 2 (The Parser) upon building it.

if __name__ == "__main__":
    #  configured Docker to put logs in this exact folder
    log_directory = "/var/log/shieldapi" 
    
    print(f"Starting ShieldAPI Anomaly Guardian (Filter 1)...")
    print(f"Listening for live traffic logs in {log_directory}...")
    
    event_handler = LogHandler()
    observer = Observer()
    observer.schedule(event_handler, log_directory, recursive=False)
    observer.start()
    
    try:
        while True:
            time.sleep(1) # Keeps the script running in the background
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
