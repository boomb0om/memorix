from enum import Enum


class CourseACLRole(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"
    PARTIAL_VIEWER = "partial_viewer"


class CourseACLGroup(str, Enum):
    """Типы групп для ACL"""
    ALL = "all"  # Доступ для всех пользователей


class LessonACLRole(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"
