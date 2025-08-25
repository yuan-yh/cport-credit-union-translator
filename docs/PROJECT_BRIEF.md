# PROJECT_BRIEF.md

**Project**: cPort Credit Union Translation Tool  
**Purpose**: Real-time multilingual banking support for Maine's immigrant communities  
**Last Updated**: August 24, 2025  
**Phase**: MVP Development  

## Overview

cPort Credit Union is implementing an AI-powered real-time translation tool to serve Maine's diverse immigrant populations through personalized, culturally-sensitive banking services. This system will provide immediate multilingual support across five languages while maintaining the personal touch that distinguishes credit unions from larger banks.

## Organization Context

### About cPort Credit Union
- **Founded**: 1931, originally Federal Employees Credit Union of Maine
- **Size**: 35,045 members with $415.84 million in assets
- **Staff**: 109 employees across 5 branches (expanding to 6)
- **Locations**: Portland, Augusta, Scarborough (Lewiston opening October 2025)
- **Recognition**: Forbes #1 Best in State Credit Union 2025 (3rd consecutive year)
- **Mission**: Community-focused financial services with emphasis on innovation and member relationships

### Target Demographics
cPort serves Maine's five-county region (Cumberland, Kennebec, Androscoggin, Sagadahoc, York) with particular focus on immigrant communities:

- **Portuguese speakers**: 1,600+ (primarily Angolan community with Kimbundu influences)
- **French speakers**: 39,000+ (Congolese community using Belgian French with Lingala influences)
- **Somali speakers**: 2,400+ (including Somali Bantu variations)
- **Arabic speakers**: 1,500+ (multiple regional dialects)
- **Spanish speakers**: 14,000+ (diverse Latin American origins)

## Business Problem Statement

### Current Challenges
1. **Language Barriers**: Immigrant members struggle with complex banking terminology and procedures
2. **Service Delays**: Staff must frequently pause to find interpreters or translation resources
3. **Cultural Misunderstandings**: Generic translations miss credit union-specific concepts and Maine community context
4. **Competitive Pressure**: Larger banks offering multilingual digital services
5. **Growth Constraints**: Language barriers limit member acquisition from fastest-growing demographic segments

### Impact on Operations
- Extended service times for multilingual customers
- Staff frustration with communication barriers
- Potential compliance issues with financial disclosures in English-only
- Missed cross-selling opportunities due to communication gaps
- Customer dissatisfaction leading to attrition

## Solution Overview

### Core Concept
A real-time translation system that combines Google Cloud's enterprise translation API with cPort-specific fine-tuned models, delivering culturally appropriate banking support through staff-mediated interactions.

### Key Differentiators
1. **Credit Union Focus**: Translations adapted for "share draft accounts," "member" vs "customer," cooperative financial concepts
2. **Maine Community Integration**: Partnerships with Greater Portland Immigrant Welcome Center and Maine Immigrants' Rights Coalition for validation
3. **Cultural Sensitivity**: Fine-tuned models understand immigrant community contexts and financial anxieties
4. **Personal Service**: Technology enhances rather than replaces human interaction
5. **Banking Compliance**: Designed for financial industry requirements and audit trails

## Target Users & Use Cases

### Primary Users

**Greeters (Universal Bankers)**
- **Role**: First point of contact, triage, queue management
- **Use Cases**: Welcome customers, understand service needs, route to appropriate staff, provide wait time estimates
- **Success Metrics**: 90% successful triage, <2 minutes average interaction time

**Tellers**
- **Role**: Transaction processing, account services
- **Use Cases**: Deposits, withdrawals, account inquiries, simple product explanations, cross-selling
- **Success Metrics**: 95% transaction accuracy, improved customer satisfaction scores

**Private Consultors (Relationship Managers)**
- **Role**: Complex services, loans, financial planning
- **Use Cases**: Loan applications, account opening, dispute resolution, financial education, investment discussions
- **Success Metrics**: Increased loan origination, improved member retention

### Secondary Users

**Branch Managers**
- **Role**: Operations oversight, staff training, compliance monitoring
- **Use Cases**: Performance analytics, quality assurance, staff coaching, system administration

**Members/Customers**
- **Role**: Banking service recipients
- **Use Cases**: Clear communication about products, understanding complex financial concepts, receiving translated summaries

## Risk Factors & Mitigation

### High-Risk Areas
1. **Translation Accuracy**: Incorrect financial information could create liability
   - *Mitigation*: Staff oversight of all translations, confidence scoring, fallback procedures

2. **Community Acceptance**: Cultural resistance to technology in sensitive financial discussions
   - *Mitigation*: Community leader partnerships, staff-mediated approach, gradual rollout

3. **Regulatory Compliance**: Banking examiners may have concerns about AI in customer interactions
   - *Mitigation*: Comprehensive audit trails, clear documentation, regulatory communication

4. **Technical Failure**: System outages during critical banking operations
   - *Mitigation*: Fallback to manual processes, local caching, multiple API providers

### Medium-Risk Areas
- Staff resistance to new technology
- Integration challenges with existing banking systems
- Cost overruns on AI services
- Performance issues with real-time translation