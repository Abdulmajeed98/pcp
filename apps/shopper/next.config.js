//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // When an AI coding agent starts the development server, Next writes an
  // `AGENTS.md` into this folder. This repository keeps its instructions for
  // agents in `CLAUDE.md` and `docs/agents`, so that is switched off.
  agentRules: false,
};

module.exports = nextConfig;
