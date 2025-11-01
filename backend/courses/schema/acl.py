from enum import Enum


class CourseACLRole(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"
    PARTIAL_VIEWER = "partial_viewer"


class LessonACLRole(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"
