# Kit's Agent Skills

Opinionated, source-checked skills for coding agents that support the [Agent Skills specification](https://agentskills.io/specification).

## Skills

### Effect

`skills/effect` guides production TypeScript development with Effect v4. It covers services, layers, Schema, Config, Schedule, Cache, Stream, HTTP clients, and testing.

The guidance is intentionally opinionated. Existing project conventions take precedence, and version-sensitive APIs should be checked against the project's installed Effect version.

## Install

Install the `skills/effect` directory in any Agent Skills-compatible client. For OpenCode, clone this repository and link the skill into the global skills directory:

```sh
git clone https://github.com/kitlangton/skills.git
mkdir -p ~/.config/opencode/skills
ln -s "$(pwd)/skills/skills/effect" ~/.config/opencode/skills/effect
```

Use the equivalent skills directory for other clients.

## Development

```sh
bun install
bun run check
```

The typecheck fixture covers representative version-sensitive APIs. The skill should still instruct agents to inspect the project-pinned package because Effect v4 is evolving.

## License

MIT
