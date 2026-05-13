import os


DEFAULT_LLM_MODEL = "qwen2.5:1.5b"


def get_llm_model() -> str:
    configured_model = os.getenv("LLM_MODEL")
    if configured_model and configured_model.strip():
        return configured_model.strip()
    return DEFAULT_LLM_MODEL
