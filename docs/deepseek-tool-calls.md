# DeepSeek Tool Calls

Only these read-only tools are exposed:

```txt
query_character_memory
query_world_lore
query_past_events
query_character_profile
```

The model never writes through tools. All writes come from the final JSON and are committed by Rust after validation.

Safety limits:

```txt
Maximum tool rounds per turn: 3
Maximum tool calls per turn: 8
```
