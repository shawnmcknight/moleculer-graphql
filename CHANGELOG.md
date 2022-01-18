# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.0-alpha.4] - 2021-11-14
### Added
- Allow `typeDefs` and `resolvers` in `serviceMixin` options to be specified via function rather than explicit values ([#64](https://github.com/shawnmcknight/moleculer-graphql/pull/64))
- Allow custom directives to be specified ([#54](https://github.com/shawnmcknight/moleculer-graphql/pull/54))
- Added mutation examples ([#33](https://github.com/shawnmcknight/moleculer-graphql/pull/33))

## [0.0.0-alpha.3] - 2021-10-17
### Added
- Enable dependabot ([#11](https://github.com/shawnmcknight/moleculer-graphql/pull/11))
- Allow introspection to be disabled ([#10](https://github.com/shawnmcknight/moleculer-graphql/pull/10))
- Allow GraphiQL to be disabled ([#9](https://github.com/shawnmcknight/moleculer-graphql/pull/9))
- Emit an event containing the built schema when schema is rebuilt ([#8](https://github.com/shawnmcknight/moleculer-graphql/pull/8))
- Support validationRules ([#7](https://github.com/shawnmcknight/moleculer-graphql/pull/7))

### Breaking Changes
- Allow specification of a context factory and change GraphQL context to no longer explicitly be the moleculer context; instead the moleculer context will be present on a `$ctx` property of the GraphQL context ([#30](https://github.com/shawnmcknight/moleculer-graphql/pull/30), [#31](https://github.com/shawnmcknight/moleculer-graphql/pull/31), and [#32](https://github.com/shawnmcknight/moleculer-graphql/pull/32))

## [0.0.0-alpha.2] - 2021-10-14
### Added
- Allow the `gatewayMixin` to accept `routeOptions` which will be merged with the default route options ([#6](https://github.com/shawnmcknight/moleculer-graphql/pull/6))
- Allow the GraphiQL Playground to accept headers ([#5](https://github.com/shawnmcknight/moleculer-graphql/pull/5))

## [0.0.0-alpha.1] - 2021-10-12
### Added
- Initial alpha release

[Unreleased]: https://github.com/shawnmcknight/moleculer-graphql/compare/0.0.0-alpha.4...HEAD
[0.0.0-alpha.4]: https://github.com/shawnmcknight/moleculer-graphql/compare/0.0.0-alpha.3...0.0.0-alpha.4
[0.0.0-alpha.3]: https://github.com/shawnmcknight/moleculer-graphql/compare/0.0.0-alpha.2...0.0.0-alpha.3
[0.0.0-alpha.2]: https://github.com/shawnmcknight/moleculer-graphql/compare/0.0.0-alpha.1...0.0.0-alpha.2
[0.0.0-alpha.1]: https://github.com/shawnmcknight/moleculer-graphql/releases/tag/0.0.0-alpha.1
