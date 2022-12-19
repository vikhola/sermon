class EmergencyLevel {
    static name = "emerg"
    static code = 0
    static color = "\u001b[33;1m"
}

class AlertLevel {
    static name = "alert"
    static code = 1
    static color = "\u001b[33m"
}

class CriticalLevel {
    static name = "crit"
    static code = 2
    static color = "\u001b[31;1m"
}

class ErrorLevel {
    static name = "error"
    static code = 3
    static color = "\u001b[31m"
}

class WarningLevel {
    static name = "warn"
    static code = 4
    static color = "\u001b[31m"
}

class NoticeLevel {
    static name = "note"
    static code = 5
    static color = "\u001b[35m"
}

class InfoLevel {
    static name = "info"
    static code = 6
    static color = "\u001b[0m"
}

class DebugLevel {
    static name = "debug"
    static code = 7
    static color = "\u001b[34m"
}

module.exports = { 
    EmergencyLevel, 
    AlertLevel, 
    CriticalLevel, 
    ErrorLevel, 
    WarningLevel, 
    NoticeLevel, 
    InfoLevel, 
    DebugLevel 
}