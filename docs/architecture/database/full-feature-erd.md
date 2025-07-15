erDiagram
    %% Enhanced Eventify Database Schema
    %% Addresses architectural feedback while maintaining business requirements
    %% See docs/architecture/design-decisions.md for detailed explanations

    %% Core Authentication & User Management
    auth_users ||--o{ user_profiles : "has_one"
    auth_users ||--o{ user_personal_data : "has_one"
    auth_users ||--o{ business_profiles : "has_one"
    auth_users ||--o{ user_addresses : "has_many"
    auth_users ||--o{ orders : "has_many"
    auth_users ||--o{ user_roles : "has_many"
    auth_users ||--o{ reports : "reports_as"

    %% User Tables
    auth_users {
        uuid id PK
        text email
        timestamp email_verified_at
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    user_profiles {
        uuid id PK, FK "auth_users.id"
        varchar display_name
        varchar avatar_url
        text bio
        varchar location_city
        varchar location_country
        timestamp created_at
        timestamp updated_at
    }

    user_personal_data {
        uuid id PK, FK "auth_users.id"
        text full_name
        text phone_number
        date date_of_birth
        text identity_number
        varchar preferred_language
        jsonb notification_preferences
        timestamp created_at
        timestamp updated_at
    }

    business_profiles {
        uuid id PK, FK "auth_users.id"
        text business_name
        business_type business_type
        text website_url
        text business_description
        text business_registration_number
        boolean can_host_events
        boolean can_post_campaigns
        boolean can_manage_venues
        boolean is_verified
        jsonb verification_documents
        
        %% iyzico merchant type fields (Turkish payment compliance)
        iyzico_merchant_type iyzico_merchant_type
        text email
        text gsm_number
        text address
        text iban
        
        %% Personal merchants only (PERSONAL type)
        text contact_name
        text contact_surname
        text identity_number
        
        %% Company merchants (PRIVATE_COMPANY & LIMITED_OR_JOINT_STOCK_COMPANY)
        text legal_company_title
        text tax_office
        text tax_number
        
        %% iyzico marketplace integration
        text sub_merchant_key
        text sub_merchant_external_id
        
        timestamp created_at
        timestamp updated_at
    }

    user_roles {
        uuid id PK
        uuid user_id FK "auth_users.id"
        app_role role
        timestamp granted_at
        uuid granted_by FK "auth_users.id"
        boolean is_active
    }

    %% Address Management
    user_addresses {
        uuid id PK
        uuid user_id FK "auth_users.id"
        varchar title
        text full_address
        varchar city
        varchar state_province
        varchar country
        varchar postal_code
        boolean is_default
        address_type type
        timestamp created_at
        timestamp updated_at
    }

    addresses {
        uuid id PK
        text full_address
        varchar city
        varchar state_province
        varchar country
        varchar postal_code
        geometry coordinates
        timestamp created_at
        timestamp updated_at
    }

    venues {
        uuid id PK
        text name
        text description
        venue_type venue_type
        uuid address_id FK "addresses.id"
        integer capacity
        jsonb amenities
        uuid business_id FK "business_profiles.id"
        boolean is_verified
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    business_hours {
        uuid id PK
        uuid business_id FK "business_profiles.id"
        day_of_week day_of_week
        time opening_time
        time closing_time
        boolean is_closed
        jsonb special_hours
        timestamp created_at
        timestamp updated_at
    }

    %% Event Management (Simplified)
    events {
        uuid id PK
        uuid business_id FK "business_profiles.id"
        text title
        text description
        text short_description
        uuid category_id FK "event_categories.id"
        event_status status
        boolean is_featured
        timestamp created_at
        timestamp updated_at
    }

    event_instances {
        uuid id PK
        uuid event_id FK "events.id"
        timestamp start_datetime
        timestamp end_datetime
        uuid venue_id FK "venues.id"
        event_instance_status status
        timestamp created_at
        timestamp updated_at
    }

    ticket_types {
        uuid id PK
        uuid event_instance_id FK "event_instances.id"
        text name
        text description
        numeric price
        varchar currency
        integer quantity_total
        integer quantity_sold
        timestamp sale_start_datetime
        timestamp sale_end_datetime
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    event_categories {
        uuid id PK
        text name
        text slug
        text description
        uuid parent_id FK "event_categories.id"
        text icon_url
        integer sort_order
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    business_categories {
        uuid id PK
        text name
        text slug
        text description
        uuid parent_id FK "business_categories.id"
        text icon_url
        integer sort_order
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    %% Event media now handled by polymorphic media table
    %% Configure in entity_types: ('event', 'events', true, true, true)

    %% Unified Favorites System (Polymorphic with Integrity)
    favorites {
        uuid id PK
        uuid user_id FK "user_profiles.id"
        uuid favoritable_id
        varchar favoritable_type
        boolean entity_exists
        timestamp entity_last_checked
        timestamp created_at
    }

    %% Business Campaigns (Restaurant/Cafe Promotions)
    campaigns {
        uuid id PK
        text title
        text description
        text terms_and_conditions
        uuid business_id FK "business_profiles.id"
        campaign_type type
        numeric discount_value
        discount_type discount_type
        text promo_code
        integer usage_limit_per_user
        integer total_usage_limit
        integer total_usage_count
        timestamp valid_from
        timestamp valid_until
        boolean is_active
        boolean requires_reservation
        timestamp created_at
        timestamp updated_at
    }

    campaign_redemptions {
        uuid id PK
        uuid campaign_id FK "campaigns.id"
        uuid user_id FK "user_profiles.id"
        numeric discount_applied
        varchar redemption_code
        boolean is_redeemed
        timestamp redeemed_at
        text notes
        timestamp created_at
    }

    %% Commerce (Marketplace Payment System)
    orders {
        uuid id PK
        uuid user_id FK "auth_users.id"
        order_status status
        numeric subtotal
        numeric tax_amount
        numeric discount_amount
        numeric total_amount
        numeric total_platform_commission
        varchar currency
        uuid billing_address_id FK "user_addresses.id"
        
        %% Payment provider tracking
        payment_provider payment_provider
        payment_status payment_status
        
        %% iyzico marketplace fields
        text iyzico_payment_id
        text iyzico_conversation_id
        
        text client_ip_address
        timestamp created_at
        timestamp updated_at
    }

    order_items {
        uuid id PK
        uuid order_id FK "orders.id"
        
        %% Polymorphic orderable item (extensible for future products)
        uuid orderable_id
        varchar orderable_type
        
        %% Item snapshot (intentional denormalization for historical accuracy)
        text item_name_snapshot
        text item_description_snapshot
        integer quantity
        numeric unit_price_snapshot
        numeric total_price
        
        %% Marketplace sub-merchant info
        uuid sub_merchant_id FK "business_profiles.id"
        text sub_merchant_key
        numeric sub_merchant_payout_amount
        numeric platform_commission_amount
        
        item_status status
        timestamp created_at
        timestamp updated_at
    }

    payment_profiles {
        uuid id PK
        uuid business_id FK "business_profiles.id"
        payment_provider provider
        
        %% iyzico specific
        text sub_merchant_key
        boolean is_approved
        text approval_status
        
        %% Generic provider config
        jsonb provider_config
        boolean is_active
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }

    payment_transactions {
        uuid id PK
        uuid order_id FK "orders.id"
        uuid business_id FK "business_profiles.id"
        transaction_type transaction_type
        numeric amount
        varchar currency
        payment_provider provider
        text provider_transaction_id
        transaction_status status
        jsonb transaction_data
        timestamp created_at
    }

    platform_settings {
        uuid id PK
        varchar setting_key
        text setting_value
        varchar data_type
        text description
        timestamp created_at
        timestamp updated_at
    }

    %% Orderable items configuration
    orderable_types {
        varchar orderable_type PK
        varchar table_name
        varchar id_column
        varchar name_column
        varchar price_column
        boolean is_active
        text description
        timestamp created_at
    }

    %% Communication (Scalable Chat Design)
    event_chats {
        uuid id PK
        uuid event_instance_id FK "event_instances.id"
        boolean is_active
        integer message_count
        timestamp last_message_at
        timestamp created_at
        timestamp updated_at
    }

    chat_participants {
        uuid id PK
        uuid chat_id FK "event_chats.id"
        uuid user_id FK "user_profiles.id"
        chat_role role
        
        %% Moderation status
        boolean is_muted
        timestamp muted_until
        boolean is_banned
        text ban_reason
        uuid banned_by FK "user_profiles.id"
        
        %% Business context
        uuid representing_business_id FK "business_profiles.id"
        
        %% Role management
        uuid role_granted_by FK "user_profiles.id"
        timestamp role_granted_at
        jsonb custom_permissions
        
        %% Participation tracking
        timestamp joined_at
        timestamp last_read_at
        integer unread_count
    }

    chat_messages {
        uuid id PK
        uuid chat_id FK "event_chats.id"
        uuid sender_id FK "user_profiles.id"
        text content
        message_type type
        uuid reply_to_id FK "chat_messages.id"
        
        %% Business context
        uuid business_context FK "business_profiles.id"
        
        %% Moderation features
        boolean is_deleted
        text deleted_reason
        uuid deleted_by FK "user_profiles.id"
        timestamp deleted_at
        boolean is_pinned
        uuid pinned_by FK "user_profiles.id"
        timestamp pinned_at
        
        %% Message status
        boolean is_edited
        boolean is_archived
        timestamp created_at
        timestamp updated_at
    }

    %% Archived messages for performance (partitioned by month)
    chat_messages_archive {
        uuid id PK
        uuid chat_id
        uuid sender_id
        text content
        message_type type
        uuid reply_to_id
        boolean is_edited
        date archive_month
        timestamp created_at
        timestamp archived_at
    }

    %% Comprehensive moderation tracking
    moderation_actions {
        uuid id PK
        uuid chat_id FK "event_chats.id"
        uuid moderator_id FK "user_profiles.id"
        uuid target_user_id FK "user_profiles.id"
        uuid target_message_id FK "chat_messages.id"
        
        %% Action details
        moderation_action_type action_type
        text reason
        interval duration
        jsonb action_data
        
        %% Appeal system
        boolean is_appealed
        text appeal_reason
        uuid resolved_by FK "user_profiles.id"
        text resolution
        timestamp resolved_at
        
        timestamp created_at
    }

    %% Chat configuration and permissions
    chat_settings {
        uuid id PK
        uuid chat_id FK "event_chats.id"
        
        %% Moderation settings
        boolean slow_mode_enabled
        integer slow_mode_seconds
        boolean links_allowed
        boolean media_allowed
        text chat_rules
        jsonb auto_moderation_config
        
        %% Permissions configuration
        jsonb moderator_permissions
        
        uuid last_updated_by FK "user_profiles.id"
        timestamp created_at
        timestamp updated_at
    }

    %% Media & Content (With Referential Integrity)
    media {
        uuid id PK
        uuid entity_id
        varchar entity_type
        text file_url
        varchar file_type
        varchar mime_type
        bigint file_size
        integer width
        integer height
        integer duration
        text alt_text
        integer sort_order
        uuid uploaded_by FK "auth_users.id"
        boolean is_active
        boolean entity_exists
        timestamp entity_last_checked
        timestamp created_at
    }

    reviews {
        uuid id PK
        uuid reviewer_id FK "user_profiles.id"
        uuid entity_id
        varchar entity_type
        integer rating
        text review_text
        boolean is_verified
        boolean entity_exists
        timestamp entity_last_checked
        timestamp created_at
        timestamp updated_at
    }

    %% Polymorphic entity validation
    entity_types {
        varchar entity_type PK
        varchar table_name
        varchar id_column
        boolean supports_media
        boolean supports_reviews
        boolean supports_favorites
        timestamp created_at
    }

    %% Orphaned record cleanup tracking
    orphaned_records {
        uuid id PK
        varchar source_table
        uuid source_record_id
        varchar entity_type
        uuid entity_id
        timestamp detected_at
        boolean cleaned_up
        timestamp cleaned_at
    }

    %% System Tables
    notifications {
        uuid id PK
        uuid user_id FK "auth_users.id"
        varchar notification_type
        text title
        text message
        jsonb data
        boolean is_read
        timestamp created_at
    }

    search_cache {
        uuid id PK
        uuid entity_id
        varchar entity_type
        tsvector search_vector
        text content
        timestamp updated_at
    }

    %% Reporting & Moderation
    reports {
        uuid id PK
        uuid reporter_id FK "auth_users.id"
        uuid reported_id
        report_type reported_type
        report_category category
        text reason
        text description
        report_status status
        uuid reviewed_by FK "auth_users.id"
        timestamp reviewed_at
        timestamp created_at
        timestamp updated_at
    }

    %% Core Entity
    auth_users {
        uuid id PK
        text email
        timestamp email_verified_at
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    %% Relationships
    %% User Management
    user_profiles ||--o{ favorites : "creates"
    user_profiles ||--o{ chat_participants : "participates"
    user_profiles ||--o{ chat_messages : "sends"
    user_profiles ||--o{ campaign_redemptions : "uses"
    user_profiles ||--o{ reviews : "writes"

    %% Business & Payment
    business_profiles ||--o{ events : "organizes"
    business_profiles ||--o{ venues : "manages"
    business_profiles ||--o{ campaigns : "posts"
    business_profiles ||--o{ payment_profiles : "has"
    business_profiles ||--o{ order_items : "receives_payment"
    business_profiles ||--o{ payment_transactions : "processes"

    %% Events & Venues
    events ||--o{ event_instances : "scheduled_on"
    event_instances ||--o{ ticket_types : "offers"
    event_instances ||--o{ event_chats : "has_chat"
    venues ||--o{ addresses : "located_at"
    venues ||--o{ event_instances : "hosts"
    venues ||--o{ business_hours : "operates_during"

    %% Categories
    event_categories ||--o{ event_categories : "has_subcategory"
    event_categories ||--o{ events : "categorizes"
    business_categories ||--o{ business_categories : "has_subcategory"

    %% Campaigns
    campaigns ||--o{ campaign_redemptions : "redeemed_in"

    %% Commerce & Payments (Polymorphic Design)
    orders ||--o{ order_items : "contains"
    orders ||--o{ user_addresses : "billed_to"
    orders ||--o{ payment_transactions : "generates"
    payment_profiles ||--o{ payment_transactions : "processes"
    orderable_types ||--o{ order_items : "defines_type"

    %% Communication (Scalable Architecture with Moderation)
    event_chats ||--o{ chat_participants : "includes"
    event_chats ||--o{ chat_messages : "contains"
    event_chats ||--o{ moderation_actions : "moderated_in"
    event_chats ||--o{ chat_settings : "configured_by"
    
    chat_participants ||--o{ moderation_actions : "moderated_by"
    chat_participants ||--o{ moderation_actions : "targeted_in"
    chat_participants ||--o{ business_profiles : "represents"
    
    chat_messages ||--o{ chat_messages : "replies_to"
    chat_messages ||--o{ chat_messages_archive : "archived_to"
    chat_messages ||--o{ moderation_actions : "action_taken_on"
    chat_messages ||--o{ business_profiles : "sent_as_business"
    
    moderation_actions ||--o{ user_profiles : "resolved_by"
    chat_settings ||--o{ user_profiles : "updated_by"

    %% Media & Content (Polymorphic with Integrity)
    media ||--o{ auth_users : "uploaded_by"
    favorites ||--o{ user_profiles : "created_by"
    reports ||--o{ auth_users : "reported_by"
    notifications ||--o{ auth_users : "sent_to"
    entity_types ||--o{ media : "validates"
    entity_types ||--o{ reviews : "validates"
    entity_types ||--o{ favorites : "validates"
    orphaned_records ||--o{ media : "tracks"
    orphaned_records ||--o{ reviews : "tracks"
    orphaned_records ||--o{ favorites : "tracks"

