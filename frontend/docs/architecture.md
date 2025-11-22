# Architecture

This document provides a detailed overview of the app's architecture.

## Clean Architecture

The app follows the Clean Architecture principles, which promotes a separation of concerns and makes the codebase easier to maintain and test. The architecture is divided into three main layers:

*   **Domain**: The innermost layer, containing the core business logic of the application. This layer is independent of any other layer and is not aware of the UI, database, or network.
*   **Data**: This layer implements the repositories defined in the domain layer. It is responsible for fetching data from the network or a local database.
*   **Presentation**: The outermost layer, containing the UI of the application. This layer is responsible for displaying data to the user and handling user input.

## Riverpod for State Management and Dependency Injection

The app uses the `flutter_riverpod` package for state management and dependency injection. Riverpod provides a simple and powerful way to manage the state of the application and to provide dependencies to the different layers of the app.

## Role-Based Routing

The app uses a role-based routing system to control access to different parts of the application. The user's role is determined from their Firebase custom claims. The app router uses this role to determine which screens the user is allowed to access.
