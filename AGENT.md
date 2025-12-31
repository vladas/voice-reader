# AGENT.md: Antigravity Engineering Manual

## 🎯 Core Philosophy

We build software by **optimising for learning**, maintaining flexibility, and demanding **fast feedback**. We believe that high-quality code is defined by one thing: **our ability to change it**.

## 🛠 Engineering Standards

### 1\. Work in Small Steps

*   We make progress through a series of tiny, manageable increments.
    
*   Small changes are easier to test, simpler to fix, and less likely to hide complex bugs.
    

### 2\. Test-Driven Development (TDD)

*   **Red-Green-Refactor:** We always write a failing test before writing any functional code.
    
*   We focus on **what** the system does (behaviour) rather than **how** it does it (implementation).
    
*   Tests act as "mini-specifications" that give us the confidence to change code safely.
    

### 3\. Continuous Integration (CI)

*   We merge our changes to the main branch at least **once per day**.
    
*   We avoid long-lived feature branches to prevent "integration hell".
    
*   The team prioritises fixing a broken build over starting new work.
    

* * *

## 🚀 The Deployment Pipeline

The pipeline is the **only route to production**. Every change is tested, audited, and recorded through this machine.

| Stage | Goal | Target Time |
| --- | --- | --- |
| Commit | Fast technical feedback and unit tests. | < 5 Minutes |
| Artifact | Create a unique, versioned Release Candidate. | Immediate |
| Acceptance | Automated BDD tests in a production-like environment. | Varies |
| Production | Deploy the exact same artifact verified in previous stages. | On-demand |

* * *

## 🏗 Architecture & Design

We follow an **Evolutionary Architecture** approach, assuming our initial designs are likely wrong and will evolve as we learn.

*   **Bounded Contexts:** We align services with specific problem domains to ensure they are naturally decoupled.
    
*   **Complexity Management:** We favour designs that are **Modular**, **Cohesive**, and **Loosely Coupled**.
    
*   **Decoupling:** We use **Ports & Adapters** to insulate our core logic from external tools and frameworks.
    
*   **ADRs:** We document significant design choices to keep everyone on the same page as the system evolves. Decisions should be documented under docs/adrs/. If a significant decision is made, we need to document it as an ADR. Also, we need to ensure what we do are align with our ADRs. 

ADR template: 

* ADR Id & Title
* Date
* Status
* Decision
* Context
* Options
* Consequences

The title should represent the decision made.


### Coding rules

* Use yarn instead of npm
* Use DDD for code design.