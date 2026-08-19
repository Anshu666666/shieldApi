import os
import time
import aiofiles
from datetime import datetime
from app.config import settings

class TrafficLogEmitter:
    """
    Asynchronously streams access logs to the shared log volume for consumption
    by the Anomaly Guardian Pipes & Filters engine.
    """
    def __init__(self, log_path: str = None):
        self.log_path = log_path or settings.LOG_FILE_PATH
        self._ensure_log_dir()

    def _ensure_log_dir(self):
        log_dir = os.path.dirname(self.log_path)
        if log_dir:
            os.makedirs(log_dir, exist_ok=True)
        if not os.path.exists(self.log_path):
            try:
                with open(self.log_path, 'a') as f:
                    pass
            except Exception as e:
                print(f"[ShieldAPI LogEmitter] Warning: Could not create log file at {self.log_path}: {e}")

    async def emit_log(
        self,
        client_ip: str,
        method: str,
        path: str,
        status_code: int,
        latency_ms: float,
        response_size: int = 0,
        user_agent: str = "ShieldAPI-Agent"
    ):
        """
        Appends an access log line matching the regex format required by Filter 2 (Log Parser):
        ^(\\d+\\.\\d+\\.\\d+\\.\\d+).*\\s(\\d{3})\\s
        """
        now_str = datetime.utcnow().strftime("%d/%b/%Y:%H:%M:%S +0000")
        log_line = f'{client_ip} - - [{now_str}] "{method} {path} HTTP/1.1" {status_code} {response_size} {latency_ms:.1f}ms "{user_agent}"\n'

        try:
            async with aiofiles.open(self.log_path, mode='a') as f:
                await f.write(log_line)
        except Exception:
            # Fallback to synchronous write or print if async file write fails
            try:
                with open(self.log_path, 'a') as f:
                    f.write(log_line)
            except Exception as e:
                print(f"[ShieldAPI LogEmitter] Failed to write access log: {e}")

log_emitter = TrafficLogEmitter()
