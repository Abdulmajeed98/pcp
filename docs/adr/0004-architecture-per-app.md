# The API follows the owner's workplace conventions; the frontends follow Feature-Sliced Design

The NestJS API is structured the way the backend services at the owner's workplace are, instead of the three-layer hexagonal layout first proposed, because the owner wants work on this project to be practice for contributing to that codebase. The two frontends follow Feature-Sliced Design instead of hexagonal architecture, because hexagonal treats the whole interface as a single adapter and so gives little guidance for organising a frontend. The research behind both choices is in [docs/research/app-architecture.md](../research/app-architecture.md).

## The API's conventions

- **Two layers.** `src/app/domain/<entity>/` and `src/app/infrastructure/<feature>/`. Infrastructure may import domain; domain never imports infrastructure. There is no separate application layer.
- **Domain.** Entity classes with getters; an abstract `<Entity>Store` class per entity, which is the port; and one class per use case, named as a Command when it changes data (`Create<Entity>Command`) and as a Query when it only reads (`ReadAll<Entity>Query`), each with its own Input and Output classes.
- **Infrastructure.** Drizzle schemas (`<entity>.schema.ts`), `Database<Entity>Store` classes that implement the ports, controllers with Request and Response classes, and the NestJS modules that wire them together.
- **Dependency injection.** The abstract Store class is the injection token: `{ provide: EntityStore, useClass: DatabaseEntityStore }`.
- **Errors.** Domain and Store code never throws. It returns Effect's `Either<Result, StructuredError>`, and the controller turns a failure into an HTTP error.
- **Access control.** One global guard. Every endpoint carries `@PreAuthorize([...roles])` or `@Public(true)`; an endpoint with neither is refused.
- **Requests and responses.** Classes validated with class-validator and described with Swagger. A Request class converts itself to a Command's Input, and a Response class is built from a Command's Output.
- **Tests.** Jest with SWC, under `src/test/`, mirroring `src/app/`: `*.spec.ts` for unit tests with mocked Stores and `*.integration-spec.ts` for tests against a real PostgreSQL in a test container.

## The frontends' conventions

- Feature-Sliced Design's layers, top to bottom: App, Pages, Widgets, Features, Entities, Shared. In the Next.js app the App and Pages layers are named `_app` and `_pages`, and Next's own `app` folder only routes.
- Imports inside a slice are relative. Imports from another slice use the `@/` alias and go through that slice's index file.
- Three bans, enforced with Oxlint's `no-restricted-imports` rule: a file may not import from a layer above its own; a slice may not import another slice on its own layer; nothing imports past a slice's index file.

## Consequences

- Use cases live in the domain layer and carry NestJS's `@Injectable()`. This is a deliberate, pragmatic departure from textbook hexagonal architecture, taken from the workplace codebase.
- This reverses an earlier choice to share Zod schemas between the API and the frontends. The frontends instead use a typed client generated from the API's OpenAPI document.
- The workplace services sit behind a proxy that verifies login tokens, so their guard only reads the token. This API has no such proxy. Its guard must verify every token's signature, expiry and issuer against Keycloak; copying the workplace's read-only behaviour here would let anyone forge an Admin token.
- The shared `compatibility` library does not use Effect, although the API does. A Compatibility Rule's outcomes (passes, Compatibility Problem, Compatibility Warning, unchecked) are not success and failure, so the library returns them as a plain value.
- The patterns are reimplemented from scratch. No source file is copied from the workplace repository.
- Steiger, Feature-Sliced Design's own linter, is not used because it is still in beta. The second ban above works only because of the relative-import convention, so that convention is part of the architecture.
- Oxlint is the only linter and covers the whole repository, the API included. ESLint is not used. The owner chose a single linter over matching the workplace, which lints with ESLint, so linting is one place where the API departs from the workplace's conventions. The workplace's domain-layer rule and its Jest test rules are ESLint configuration, so they are re-expressed for Oxlint instead of carried over. Nx's boundary rule runs under Oxlint through a plugin that Nx marks as experimental. That plugin imports ESLint as a library and does not load without it, so the ESLint package stays in the installed dependencies, where pnpm puts it as a peer of Nx's own packages. No manifest lists it, nothing configures it and nothing runs it. Turning off pnpm's automatic peer installation would remove it, at the cost of Nx's boundary rule.
- Oxfmt formats the whole repository. It is still before version 1.0, so its version is pinned exactly and upgrades are reviewed for formatting changes.
