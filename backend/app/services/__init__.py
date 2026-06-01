"""Service layer — business logic behind the API routes.

Each service is a clean boundary. Some carry data faithfully adapted from
StoryPlanner (writing modes); others are placeholder stubs (PSYKE search, Logos
inline) that can later be wired to real StoryPlanner logic without changing the
API contract. StoryPlanner itself is never imported.
"""
