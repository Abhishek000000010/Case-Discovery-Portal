import pytest
from backend.app.state import app_state


@pytest.fixture(scope="session", autouse=True)
def initialize_test_environment():
    """
    Ensure the application state is populated for all backend unit and integration tests.
    """
    if not app_state.cases:
        app_state.initialize()
