# Implementation Plan: OAuth Provider Package

## Overview

Incrementally build the OAuth provider npm package starting with project setup, then the HTTP utility, Google provider, core factory, entry point, tests, and documentation. Each task builds on the previous, ensuring no orphaned code.

## Tasks

- [x] 1. Set up project structure and package configuration
  - Initialize `package.json` with name, version, description, keywords, license, main pointing to `src/index.js`, and `axios` as a runtime dependency
  - Create directory structure: `src/core/`, `src/providers/`, `src/utils/`, `tests/unit/`, `tests/property/`
  - Install dependencies: `axios`, and dev dependencies: `jest`, `fast-check`
  - Configure Jest in `package.json` or `jest.config.js`
  - _Requirements: 9.1, 9.2, 9.3, 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 2. Implement HTTP client utility
  - [x] 2.1 Create `src/utils/http.js` with async `post(url, data)` function
    - Wrap axios POST call, return `response.data` on success
    - On failure: throw Error with `error.response.data` if available, otherwise throw original error
    - Add JSDoc annotations for parameter types and return type
    - _Requirements: 5.1, 5.2, 5.3, 8.2_

  - [ ]* 2.2 Write unit tests for HTTP client (`tests/unit/http.test.js`)
    - Test successful POST returns response data
    - Test failure with response data throws Error containing that data
    - Test failure without response data throws original error
    - _Requirements: 5.1, 5.2_

  - [ ]* 2.3 Write property test for HTTP client (`tests/property/http.property.js`)
    - **Property 8: HTTP client post returns data on success and throws with details on failure**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 3. Implement Google OAuth provider
  - [x] 3.1 Create `src/providers/google.js` with `createGoogleProvider(config)` factory function
    - Implement `getAuthUrl(options?)` that builds URL to `https://accounts.google.com/o/oauth2/v2/auth` with correct query params (`client_id`, `redirect_uri`, `response_type=code`, `scope`, optional `state`)
    - Default scope: `"profile email"`
    - Implement `getToken(code)` that validates code is non-empty, POSTs to `https://oauth2.googleapis.com/token` via HTTP client, returns response data
    - Throw `"Authorization code is required"` if code is falsy/empty
    - Add JSDoc annotations for all public methods
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 7.1, 8.2_

  - [ ]* 3.2 Write unit tests for Google provider (`tests/unit/google.test.js`)
    - Test `getAuthUrl()` returns correct URL with defaults
    - Test `getAuthUrl({ scope, state })` includes custom scope and state
    - Test `getToken(code)` calls HTTP client with correct params
    - Test `getToken()` throws without code
    - Mock `http.post` for token tests
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 3.3 Write property tests for Google provider (`tests/property/google.property.js`)
    - **Property 5: getAuthUrl produces a well-formed authorization URL**
    - **Property 6: getToken sends correct token exchange request and returns response**
    - **Property 7: getToken rejects missing or empty authorization codes**
    - **Property 9: getToken propagates HTTP errors from token endpoint**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4**

- [x] 4. Checkpoint - Verify provider and utility
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement core factory client
  - [x] 5.1 Create `src/core/client.js` with `createOAuthClient(config)` function
    - Validate config is a non-null plain object; throw `"Configuration object is required"` otherwise
    - Implement `validateProviderConfig(providerName, config)` internal function checking `clientId`, `clientSecret`, `redirectUri`
    - Implement provider registry mapping `"google"` to `createGoogleProvider`
    - Iterate config keys, skip unsupported, validate and instantiate supported providers
    - Return OAuth client object with provider instances
    - Add JSDoc annotations for `createOAuthClient`, `ProviderConfig`, and `OAuthClient` types
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 7.2, 7.3, 8.1, 8.3_

  - [ ]* 5.2 Write unit tests for factory client (`tests/unit/client.test.js`)
    - Test valid config returns client with google provider
    - Test unsupported keys are ignored
    - Test null/undefined/non-object config throws
    - Test missing `clientId`, `clientSecret`, `redirectUri` each throw with descriptive message
    - Test empty config `{}` returns empty client
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 5.3 Write property tests for factory client (`tests/property/client.property.js`)
    - **Property 1: Factory initializes providers for all supported config keys**
    - **Property 2: Factory ignores unsupported provider keys**
    - **Property 3: Factory rejects non-object config values**
    - **Property 4: Missing required provider config fields throw descriptive errors**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4**

- [ ] 6. Create package entry point and verify exports
  - [x] 6.1 Create `src/index.js` that re-exports `createOAuthClient` from `src/core/client.js`
    - Only export `createOAuthClient` as a named export
    - _Requirements: 6.1, 6.2, 11.2_

  - [ ]* 6.2 Write unit test verifying module exports (`tests/unit/index.test.js`)
    - Verify `createOAuthClient` is exported
    - Verify no internal modules are exposed
    - _Requirements: 6.1, 6.2_

- [x] 7. Checkpoint - Ensure full package works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create README documentation
  - Create `README.md` with installation section, usage example showing `createOAuthClient` initialization, `getAuthUrl()`, and `getToken(code)` usage
  - Include API reference section documenting all public methods with parameters and return values
  - Include section on adding new providers
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
