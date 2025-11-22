# Flutter Loyalty App

This is a production-ready Flutter app for Android & iOS, built for a loyalty program. The app is aligned with a Firebase backend, including Firebase Auth and callable Cloud Functions.

## Overview and Roles

The app supports three user roles:

*   **Customer**: Can register, log in, view their profile, points balance, and transaction history.
*   **Manager**: Can credit and redeem points for customers at their assigned bunk.
*   **Admin**: Can manage bunks, users, and global application settings.

## Setup

### Prerequisites

*   Flutter SDK (stable channel)
*   Firebase CLI
*   An IDE like VS Code or Android Studio

### Installation

1.  **Clone the repository.**
2.  **Set up Firebase:**
    *   Create a new Firebase project.
    *   Add Android and iOS apps to your Firebase project.
    *   Download the `google-services.json` and `GoogleService-Info.plist` files and place them in the `android/app` and `ios/Runner` directories, respectively.
3.  **Environment Variables:**
    *   Create a `.env` file in the root of the `frontend` directory.
    *   Add any environment-specific variables to this file.

## How to Run

### Running with real Cloud Functions

1.  Make sure your Firebase backend is deployed.
2.  Run the app:

```bash
flutter run
```

### Running with Mocks

To run the app with mocked data for development and testing, you can configure the dependency injection to use mock repositories.

## Architecture & Layers

The app follows the Clean Architecture principles, with the following layers:

*   **Domain**: Contains the core business logic of the application, including models, repositories, and use cases.
*   **Data**: Implements the repositories defined in the domain layer, and is responsible for fetching data from the network or a local database.
*   **Presentation**: Contains the UI of the application, including screens, widgets, and state management.

For more details, see [docs/architecture.md](docs/architecture.md).

## Screen to Cloud Functions Mapping

For a detailed mapping of which screens and use cases use which Cloud Functions, please see [docs/api_mapping.md](docs/api_mapping.md).

## Validation

The app's validation logic is designed to mirror the backend's validation rules. This ensures a consistent user experience and reduces the number of invalid requests sent to the backend. All validation rules are defined in the `domain/validators` directory and are unit-tested.

## How to Run Tests and Coverage

### Running Tests

To run all tests (unit, widget, and integration), use the following command:

```bash
flutter test
```

### Test Coverage

To run tests and generate a coverage report, use the following command:

```bash
flutter test --coverage
```

This will generate a `coverage/lcov.info` file. To view the report in HTML format, you can use the `genhtml` tool:

```bash
genhml coverage/lcov.info -o coverage/html
```

## CI Workflow

The project includes a GitHub Actions workflow for continuous integration. The workflow is defined in `.github/workflows/flutter-ci.yml`. This workflow runs on every push and pull request to the `main` branch, and it performs the following steps:

1.  Sets up the Flutter environment.
2.  Installs dependencies (`flutter pub get`).
3.  Analyzes the code for any issues (`flutter analyze`).
4.  Runs all tests (`flutter test --coverage`).
5.  Uploads the coverage report as a build artifact.

## Contribution & Coding Style

Please follow the existing coding style and conventions. The project uses `flutter_lints` to enforce a consistent code style. Before submitting a pull request, please make sure to run `flutter analyze` and address any issues.
