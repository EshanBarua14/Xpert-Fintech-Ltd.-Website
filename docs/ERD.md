# XPERT NEXUS — Entity relationship diagram

Generated from `prisma/schema.prisma` by `npm run db:erd`. Do not edit by hand.

68 tables, 20 enums. `*Translation` tables hold one row per locale (en, bn).
Polymorphic links (ContentRelation, SeoMetadata, MediaUsage) use `entityType` + `entityId` and are not drawn as lines.

```mermaid
erDiagram
  AdminUser ||--o{ Session : "adminUser"
  AdminUser ||--o{ PasswordReset : "adminUser"
  Office ||--o{ OfficeTranslation : "office"
  MediaFolder |o--o{ MediaFolder : "parent"
  MediaFolder |o--o{ Media : "folder"
  Media ||--o{ MediaTranslation : "media"
  Media ||--o{ MediaUsage : "media"
  Page ||--o{ PageTranslation : "page"
  Page ||--o{ PageSection : "page"
  PageSection ||--o{ ContentBlock : "section"
  ContentBlock ||--o{ ContentBlockTranslation : "block"
  ContentBlock ||--o{ BlockItem : "block"
  BlockItem ||--o{ BlockItemTranslation : "item"
  NavMenu ||--o{ NavItem : "menu"
  NavItem |o--o{ NavItem : "parent"
  NavItem ||--o{ NavItemTranslation : "item"
  OfferingCategory ||--o{ OfferingCategoryTranslation : "category"
  OfferingCategory |o--o{ Offering : "category"
  Offering |o--o{ Offering : "parent"
  Offering ||--o{ OfferingTranslation : "offering"
  Offering ||--o{ OfferingItem : "offering"
  OfferingItem ||--o{ OfferingItemTranslation : "item"
  Offering ||--o{ OfferingMedia : "offering"
  OfferingMedia ||--o{ OfferingMediaTranslation : "item"
  Page |o--o{ Solution : "page"
  Solution ||--o{ SolutionTranslation : "solution"
  Organization ||--o{ OrganizationTranslation : "organization"
  Organization |o--o{ Deployment : "organization"
  Offering |o--o{ Deployment : "offering"
  Deployment ||--o{ DeploymentTranslation : "deployment"
  CaseStudy ||--o{ CaseStudyTranslation : "caseStudy"
  Organization |o--o{ Testimonial : "organization"
  Testimonial ||--o{ TestimonialTranslation : "testimonial"
  Certification ||--o{ CertificationTranslation : "certification"
  Metric ||--o{ MetricTranslation : "metric"
  Person ||--o{ PersonTranslation : "person"
  Person ||--o{ PersonRole : "person"
  PersonRole ||--o{ PersonRoleTranslation : "role"
  Career ||--o{ CareerTranslation : "career"
  Career ||--o{ CareerApplication : "career"
  ArticleCategory ||--o{ ArticleCategoryTranslation : "category"
  Tag ||--o{ TagTranslation : "tag"
  ArticleCategory |o--o{ Article : "category"
  Article ||--o{ ArticleTranslation : "article"
  Article ||--o{ ArticleTag : "article"
  Tag ||--o{ ArticleTag : "tag"
  Event ||--o{ EventTranslation : "event"
  Event ||--o{ EventMedia : "event"
  Event ||--o{ EventOrganization : "event"
  Organization ||--o{ EventOrganization : "organization"
  Resource ||--o{ ResourceTranslation : "resource"
  Offering |o--o{ Lead : "interestedOffering"
  AdminUser |o--o{ Lead : "owner"
  Lead ||--o{ LeadActivity : "lead"
  AdminUser {
    String id PK
    String email UK
    String name
    String passwordHash
    String totpSecret
    Boolean totpEnabled
    Boolean isActive
    Int failedLoginCount
    DateTime lockedUntil
    DateTime lastLoginAt
    DateTime createdAt
    DateTime updatedAt
  }
  Session {
    String id PK
    String tokenHash UK
    String adminUserId FK
    String ip
    String userAgent
    DateTime createdAt
    DateTime lastSeenAt
    DateTime expiresAt
    DateTime revokedAt
  }
  PasswordReset {
    String id PK
    String tokenHash UK
    String adminUserId FK
    DateTime expiresAt
    DateTime usedAt
    DateTime createdAt
  }
  SiteSetting {
    String key PK
    Json value
    String updatedById
    DateTime updatedAt
  }
  Office {
    String id PK
    String key UK
    String email
    String phone
    String mapUrl
    Decimal latitude
    Decimal longitude
    Boolean isPrimary
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  OfficeTranslation {
    String id PK
    String officeId FK
    Locale locale
    String name
    String address
    String hours
  }
  MediaFolder {
    String id PK
    String name
    String parentId FK
    DateTime createdAt
    DateTime updatedAt
  }
  Media {
    String id PK
    MediaKind kind
    String storageKey UK
    String originalName
    String mimeType
    Int sizeBytes
    Int width
    Int height
    Int durationSec
    String checksum
    String_list tags
    String folderId FK
    Boolean isScanned
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  MediaTranslation {
    String id PK
    String mediaId FK
    Locale locale
    String altText
    String caption
  }
  MediaUsage {
    String id PK
    String mediaId FK
    EntityType entityType
    String entityId
    String field
  }
  Page {
    String id PK
    String key UK
    String template
    Boolean showInSearch
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  PageTranslation {
    String id PK
    String pageId FK
    Locale locale
    String path
    String title
    String intro
  }
  PageSection {
    String id PK
    String pageId FK
    String anchorId
    String variant
    Boolean isHidden
    Int sortOrder
    DateTime createdAt
    DateTime updatedAt
  }
  ContentBlock {
    String id PK
    String sectionId FK
    BlockType type
    Json props
    Boolean isHidden
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  ContentBlockTranslation {
    String id PK
    String blockId FK
    Locale locale
    String eyebrow
    String title
    String subtitle
    String body
    String ctaLabel
    String ctaHref
    Json data
  }
  BlockItem {
    String id PK
    String blockId FK
    String mediaId
    String iconName
    String linkUrl
    Json props
    Boolean isHidden
    Int sortOrder
    DateTime createdAt
    DateTime updatedAt
  }
  BlockItemTranslation {
    String id PK
    String itemId FK
    Locale locale
    String title
    String subtitle
    String body
    String ctaLabel
    Json data
  }
  NavMenu {
    String id PK
    String key UK
    String name
    DateTime createdAt
    DateTime updatedAt
  }
  NavItem {
    String id PK
    String menuId FK
    String parentId FK
    NavLinkType linkType
    String href
    EntityType entityType
    String entityId
    Boolean openInNewTab
    Boolean isHidden
    Boolean isCta
    Int sortOrder
    DateTime createdAt
    DateTime updatedAt
  }
  NavItemTranslation {
    String id PK
    String itemId FK
    Locale locale
    String label
    String description
  }
  OfferingCategory {
    String id PK
    String key UK
    Int sortOrder
    DateTime createdAt
    DateTime updatedAt
  }
  OfferingCategoryTranslation {
    String id PK
    String categoryId FK
    Locale locale
    String name
  }
  Offering {
    String id PK
    String key UK
    OfferingType type
    String categoryId FK
    String parentId FK
    String iconMediaId
    String heroMediaId
    Boolean isFeatured
    Boolean hasOwnPage
    Boolean showDemoCta
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  OfferingTranslation {
    String id PK
    String offeringId FK
    Locale locale
    String slug
    String name
    String tagline
    String summary
    String problem
    String solution
    String body
    String targetCustomers
    String ctaLabel
  }
  OfferingItem {
    String id PK
    String offeringId FK
    OfferingItemKind kind
    String iconName
    String mediaId
    Boolean isHidden
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
  }
  OfferingItemTranslation {
    String id PK
    String itemId FK
    Locale locale
    String title
    String body
  }
  OfferingMedia {
    String id PK
    String offeringId FK
    OfferingMediaKind kind
    String mediaId
    VideoProvider videoProvider
    String videoUrl
    String posterMediaId
    Boolean isConceptual
    Boolean isHidden
    Int sortOrder
    DateTime createdAt
    DateTime updatedAt
  }
  OfferingMediaTranslation {
    String id PK
    String itemId FK
    Locale locale
    String caption
    String transcript
  }
  Solution {
    String id PK
    String key UK
    String heroMediaId
    String pageId FK
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  SolutionTranslation {
    String id PK
    String solutionId FK
    Locale locale
    String slug
    String name
    String summary
    String body
  }
  Organization {
    String id PK
    String key UK
    OrganizationKind kind
    String websiteUrl
    String logoMediaId
    Boolean logoPermission
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  OrganizationTranslation {
    String id PK
    String organizationId FK
    Locale locale
    String name
    String shortName
    String description
  }
  Deployment {
    String id PK
    String key UK
    String organizationId FK
    String offeringId FK
    String appName
    String androidPackage
    String playStoreUrl
    String appStoreUrl
    String webUrl
    DateTime launchedAt
    DateTime linksCheckedAt
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  DeploymentTranslation {
    String id PK
    String deploymentId FK
    Locale locale
    String summary
  }
  CaseStudy {
    String id PK
    String coverMediaId
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  CaseStudyTranslation {
    String id PK
    String caseStudyId FK
    Locale locale
    String slug
    String title
    String summary
    String challenge
    String solution
    String outcome
  }
  Testimonial {
    String id PK
    String organizationId FK
    String personName
    String photoMediaId
    Boolean hasApproval
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  TestimonialTranslation {
    String id PK
    String testimonialId FK
    Locale locale
    String personTitle
    String quote
  }
  Certification {
    String id PK
    String issuer
    DateTime issuedAt
    DateTime expiresAt
    String documentMediaId
    String sourceUrl
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  CertificationTranslation {
    String id PK
    String certificationId FK
    Locale locale
    String name
    String description
  }
  Metric {
    String id PK
    String key UK
    String value
    String unit
    String period
    String sourceUrl
    String sourceNote
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  MetricTranslation {
    String id PK
    String metricId FK
    Locale locale
    String label
  }
  Person {
    String id PK
    String key UK
    String photoMediaId
    String linkedinUrl
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  PersonTranslation {
    String id PK
    String personId FK
    Locale locale
    String name
    String bio
  }
  PersonRole {
    String id PK
    String personId FK
    PersonGroup group
    Int sortOrder
    DateTime createdAt
    DateTime updatedAt
  }
  PersonRoleTranslation {
    String id PK
    String roleId FK
    Locale locale
    String title
  }
  Career {
    String id PK
    String department
    String location
    EmploymentType employmentType
    String experience
    DateTime deadline
    Boolean isClosed
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  CareerTranslation {
    String id PK
    String careerId FK
    Locale locale
    String slug
    String title
    String summary
    String responsibilities
    String requirements
    String benefits
  }
  CareerApplication {
    String id PK
    String careerId FK
    String name
    String email
    String phone
    String coverLetter
    String cvMediaId
    ApplicationStatus status
    String adminNotes
    Boolean consent
    String ip
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  ArticleCategory {
    String id PK
    String key UK
    Int sortOrder
    DateTime createdAt
    DateTime updatedAt
  }
  ArticleCategoryTranslation {
    String id PK
    String categoryId FK
    Locale locale
    String slug
    String name
  }
  Tag {
    String id PK
    String key UK
    DateTime createdAt
  }
  TagTranslation {
    String id PK
    String tagId FK
    Locale locale
    String slug
    String name
  }
  Article {
    String id PK
    String categoryId FK
    String authorName
    String coverMediaId
    DateTime displayDate
    String legacyUrl
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  ArticleTranslation {
    String id PK
    String articleId FK
    Locale locale
    String slug
    String title
    String subtitle
    String excerpt
    String body
  }
  ArticleTag {
    String articleId FK
    String tagId FK
  }
  Event {
    String id PK
    String key UK
    DateTime startsAt
    DateTime endsAt
    Boolean dateIsApprox
    String coverMediaId
    String videoUrl
    String legacyUrl
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  EventTranslation {
    String id PK
    String eventId FK
    Locale locale
    String slug
    String title
    String summary
    String body
    String location
  }
  EventMedia {
    String id PK
    String eventId FK
    String mediaId
    Int sortOrder
    DateTime createdAt
  }
  EventOrganization {
    String eventId FK
    String organizationId FK
    Int sortOrder
  }
  Resource {
    String id PK
    ResourceKind kind
    String fileMediaId
    String externalUrl
    String coverMediaId
    ContentStatus status
    DateTime publishAt
    Int sortOrder
    String createdById
    String updatedById
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  ResourceTranslation {
    String id PK
    String resourceId FK
    Locale locale
    String slug
    String title
    String summary
  }
  ContentRelation {
    String id PK
    EntityType fromType
    String fromId
    EntityType toType
    String toId
    Int sortOrder
    DateTime createdAt
  }
  Lead {
    String id PK
    LeadSource source
    LeadStatus status
    String name
    String organization
    String designation
    String email
    String phone
    String country
    String businessType
    String interestedOfferingId FK
    String expectedRequirement
    String message
    ContactMethod preferredContact
    Boolean consent
    DateTime consentAt
    String ownerId FK
    DateTime followUpAt
    Locale locale
    String pageUrl
    Json utm
    String ip
    String userAgent
    DateTime createdAt
    DateTime updatedAt
    DateTime deletedAt
  }
  LeadActivity {
    String id PK
    String leadId FK
    LeadActivityKind kind
    String body
    LeadStatus fromStatus
    LeadStatus toStatus
    String createdById
    DateTime createdAt
  }
  MarketDataSource {
    String id PK
    String name
    MarketDataMode mode
    String providerName
    String licenceReference
    DateTime licenceExpiresAt
    Int displayDelayMinutes
    Boolean isActive
    Json config
    String updatedById
    DateTime createdAt
    DateTime updatedAt
  }
  SeoMetadata {
    String id PK
    EntityType entityType
    String entityId
    Locale locale
    String title
    String description
    String canonicalUrl
    String ogTitle
    String ogDescription
    String ogImageId
    String twitterImageId
    String robots
    String schemaType
    String_list keywords
    DateTime updatedAt
  }
  Redirect {
    String id PK
    String fromPath UK
    String toPath
    Int statusCode
    Boolean isActive
    Int hits
    String note
    DateTime createdAt
    DateTime updatedAt
  }
```
