-- The backend tables Hibernate created on dev after the August release (wallet cards, product photos,
-- erasure ledger, favorite stores, store names), exactly as dev has them, because dev is baselined at this version.
-- Built from pg_dump --schema-only --no-owner --no-privileges of dev on 2026-11-11.

CREATE TABLE public.erasure_ledger (
    user_id uuid NOT NULL,
    erased_at timestamp(6) without time zone NOT NULL,
    scope character varying(32) DEFAULT 'account'::character varying NOT NULL
);

CREATE TABLE public.favorite_store (
    id uuid NOT NULL,
    store_key character varying(255) NOT NULL,
    user_id uuid NOT NULL
);

CREATE TABLE public.photo_cleanup (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    key_or_prefix character varying(512) NOT NULL,
    is_prefix boolean NOT NULL
);

CREATE TABLE public.product_image (
    id uuid NOT NULL,
    confirmed_by_id uuid,
    contributor_id uuid,
    created_at timestamp(6) without time zone NOT NULL,
    crop_height integer,
    crop_width integer,
    crop_x integer,
    crop_y integer,
    ean character varying(14) NOT NULL,
    external_key character varying(32),
    external_rev character varying(16),
    flagged_at timestamp(6) without time zone,
    full_key character varying(255),
    lang character varying(8),
    original_height integer,
    original_key character varying(255),
    original_width integer,
    rendered_at timestamp(6) without time zone,
    report_count integer NOT NULL,
    rotation integer NOT NULL,
    source character varying(20) NOT NULL,
    status character varying(12) NOT NULL,
    thumb_key character varying(255),
    hidden_reason character varying(12),
    render_attempts integer,
    render_retry_at timestamp(6) without time zone,
    small_key character varying(255),
    content_sha256 character varying(64),
    deleted_at timestamp(6) without time zone,
    deleted_by_id uuid,
    full_height integer,
    full_width integer
);

CREATE TABLE public.product_image_import_run (
    kind character varying(32) NOT NULL,
    finished_at timestamp(6) without time zone NOT NULL
);

CREATE TABLE public.product_image_report (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    image_id uuid NOT NULL,
    user_id uuid NOT NULL
);

CREATE TABLE public.product_image_set (
    ean character varying(14) NOT NULL,
    brand character varying(120),
    chain_count integer NOT NULL,
    main_image_id uuid,
    name character varying(200),
    needs_review boolean NOT NULL,
    off_details_fetched_at timestamp(6) without time zone,
    pinned boolean NOT NULL,
    reviewed_at timestamp(6) without time zone,
    reviewed_by_id uuid,
    store_listings integer NOT NULL
);

CREATE TABLE public.store_name_suggestion (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    hidden boolean NOT NULL,
    name character varying(60) NOT NULL,
    normalized_name character varying(60) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    use_count integer NOT NULL
);

CREATE TABLE public.store_name_usage (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    user_id uuid NOT NULL,
    suggestion_id uuid NOT NULL
);

CREATE TABLE public.wallet_card (
    id uuid NOT NULL,
    archived_at timestamp(6) without time zone,
    balance numeric(19,4),
    balance_unit character varying(8),
    barcode_value character varying(4096),
    card_color character varying(7) NOT NULL,
    card_name character varying(60) NOT NULL,
    card_type character varying(16) NOT NULL,
    chain_code character varying(40),
    code_type character varying(32) NOT NULL,
    code_value character varying(4096) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    deleted_at timestamp(6) without time zone,
    expires_on date,
    last_used_at timestamp(6) without time zone,
    note character varying(500),
    pinned_at timestamp(6) without time zone,
    store_name character varying(60) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    valid_from date,
    user_id uuid NOT NULL
);

CREATE TABLE public.wallet_card_photo (
    id uuid NOT NULL,
    byte_size integer NOT NULL,
    content_type character varying(32) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    full_key character varying(255) NOT NULL,
    sha256 character(64) NOT NULL,
    slot character varying(8) NOT NULL,
    thumb_key character varying(255),
    card_id uuid NOT NULL
);

ALTER TABLE ONLY public.erasure_ledger
    ADD CONSTRAINT erasure_ledger_pkey PRIMARY KEY (user_id);

ALTER TABLE ONLY public.favorite_store
    ADD CONSTRAINT favorite_store_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.photo_cleanup
    ADD CONSTRAINT photo_cleanup_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_image_import_run
    ADD CONSTRAINT product_image_import_run_pkey PRIMARY KEY (kind);

ALTER TABLE ONLY public.product_image
    ADD CONSTRAINT product_image_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_image_report
    ADD CONSTRAINT product_image_report_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_image_set
    ADD CONSTRAINT product_image_set_pkey PRIMARY KEY (ean);

ALTER TABLE ONLY public.store_name_suggestion
    ADD CONSTRAINT store_name_suggestion_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.store_name_usage
    ADD CONSTRAINT store_name_usage_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.favorite_store
    ADD CONSTRAINT ukm375d9hftmo91eoor55skqnew UNIQUE (user_id, store_key);

ALTER TABLE ONLY public.product_image
    ADD CONSTRAINT uq_product_image_external UNIQUE (ean, source, external_key);

ALTER TABLE ONLY public.product_image_report
    ADD CONSTRAINT uq_product_image_report_user UNIQUE (image_id, user_id);

ALTER TABLE ONLY public.store_name_suggestion
    ADD CONSTRAINT uq_store_name_normalized UNIQUE (normalized_name);

ALTER TABLE ONLY public.store_name_usage
    ADD CONSTRAINT uq_store_name_usage_user_suggestion UNIQUE (user_id, suggestion_id);

ALTER TABLE ONLY public.wallet_card_photo
    ADD CONSTRAINT uq_wallet_card_photo_slot UNIQUE (card_id, slot);

ALTER TABLE ONLY public.wallet_card_photo
    ADD CONSTRAINT wallet_card_photo_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.wallet_card
    ADD CONSTRAINT wallet_card_pkey PRIMARY KEY (id);

CREATE INDEX idx_product_image_ean ON public.product_image USING btree (ean);

CREATE INDEX idx_product_image_set_listings ON public.product_image_set USING btree (store_listings);

CREATE INDEX idx_product_image_sha256 ON public.product_image USING btree (content_sha256);

CREATE INDEX idx_wallet_card_user ON public.wallet_card USING btree (user_id);

ALTER TABLE ONLY public.store_name_usage
    ADD CONSTRAINT fkfm90lc7kdt2x8ndhyukotfvb5 FOREIGN KEY (suggestion_id) REFERENCES public.store_name_suggestion(id);

ALTER TABLE ONLY public.wallet_card
    ADD CONSTRAINT fkk5qtx14qd2u433hw3lf97590s FOREIGN KEY (user_id) REFERENCES public.app_user(id);

ALTER TABLE ONLY public.favorite_store
    ADD CONSTRAINT fkl1q7x5rx4rv3quebpu33x8no7 FOREIGN KEY (user_id) REFERENCES public.app_user(id);

ALTER TABLE ONLY public.wallet_card_photo
    ADD CONSTRAINT fko5hp6egd77098gnebeq5eqi4h FOREIGN KEY (card_id) REFERENCES public.wallet_card(id);

