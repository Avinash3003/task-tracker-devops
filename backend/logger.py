import logging
import sys
from pythonjsonlogger import jsonlogger
from contextvars import ContextVar

correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="unknown")

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        log_record['service_name'] = 'backend-service'
        log_record['correlation_id'] = correlation_id_var.get()

def setup_logger():
    logger = logging.getLogger("backend_logger")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    
    if logger.handlers:
        return logger

    formatter = CustomJsonFormatter(
        '%(asctime)s %(levelname)s %(message)s',
        rename_fields={"asctime": "timestamp", "levelname": "level"}
    )
    
    # stdout for Docker/Kubernetes native capture
    logHandler = logging.StreamHandler(sys.stdout)
    logHandler.setFormatter(formatter)
    logger.addHandler(logHandler)
    
    # File handler for local log tracking (per user request)
    fileHandler = logging.FileHandler("app.log")
    fileHandler.setFormatter(formatter)
    logger.addHandler(fileHandler)
    
    return logger

log = setup_logger()
