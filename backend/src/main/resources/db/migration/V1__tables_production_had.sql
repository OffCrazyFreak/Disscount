-- The backend tables production had before Flyway, exactly as Hibernate created them there (names included),
-- because production is baselined at this version and never runs this file.
-- Built from pg_dump --schema-only --no-owner --no-privileges of production on 2026-11-11.

CREATE TABLE public.app_user (
    id uuid NOT NULL,
    account_type character varying(255) NOT NULL,
    acquisition_channel character varying(255),
    created_at timestamp(6) without time zone NOT NULL,
    deleted_at timestamp(6) without time zone,
    feedback_contact_enabled_at timestamp(6) without time zone,
    image text,
    newsletter_enabled_at timestamp(6) without time zone,
    notifications_email_enabled_at timestamp(6) without time zone,
    notifications_push_enabled_at timestamp(6) without time zone,
    username character varying(255),
    onboarding_completed_at timestamp(6) without time zone,
    onboarding_outcome character varying(255),
    last_active_at timestamp(6) without time zone,
    CONSTRAINT app_user_account_type_check CHECK (((account_type)::text = ANY (ARRAY[('ADMIN'::character varying)::text, ('CONSUMER'::character varying)::text, ('ENTERPRISE'::character varying)::text, ('PUBLIC_SECTOR'::character varying)::text]))),
    CONSTRAINT app_user_acquisition_channel_check CHECK (((acquisition_channel)::text = ANY (ARRAY[('GOOGLE_SEARCH'::character varying)::text, ('INSTAGRAM'::character varying)::text, ('FACEBOOK'::character varying)::text, ('TIKTOK'::character varying)::text, ('YOUTUBE'::character varying)::text, ('FRIEND_OR_FAMILY'::character varying)::text, ('ONLINE_AD'::character varying)::text, ('BLOG_OR_NEWS'::character varying)::text, ('APP_STORE'::character varying)::text, ('POSTER_OR_FLYER'::character varying)::text, ('EVENT'::character varying)::text, ('OTHER'::character varying)::text])))
);

CREATE TABLE public.contact_message (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    deleted_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone NOT NULL,
    email character varying(255),
    full_name character varying(255),
    message character varying(5000) NOT NULL,
    read_at timestamp(6) without time zone,
    source_path character varying(255),
    subject character varying(255) NOT NULL,
    user_id uuid
);

CREATE TABLE public.pinned_place (
    id uuid NOT NULL,
    place_api_id character varying(255) NOT NULL,
    place_name character varying(255) NOT NULL,
    user_id uuid NOT NULL
);

CREATE TABLE public.pinned_store (
    id uuid NOT NULL,
    store_api_id character varying(255) NOT NULL,
    store_name character varying(255) NOT NULL,
    user_id uuid NOT NULL
);

CREATE TABLE public.shopping_list (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    deleted_at timestamp(6) without time zone,
    title character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    owner_id uuid NOT NULL,
    link_access character varying(16),
    CONSTRAINT shopping_list_link_access_check CHECK (((link_access)::text = ANY (ARRAY[('NONE'::character varying)::text, ('VIEW'::character varying)::text, ('SHOP'::character varying)::text, ('EDIT'::character varying)::text, ('OWNER'::character varying)::text])))
);

CREATE TABLE public.shopping_list_item (
    id uuid NOT NULL,
    amount integer NOT NULL,
    avg_price numeric(10,4),
    brand character varying(255),
    chain_code character varying(255),
    created_at timestamp(6) without time zone NOT NULL,
    deleted_at timestamp(6) without time zone,
    ean character varying(255),
    is_checked boolean NOT NULL,
    name character varying(255) NOT NULL,
    quantity character varying(255),
    store_price numeric(10,4),
    unit character varying(255),
    updated_at timestamp(6) without time zone NOT NULL,
    shopping_list_id uuid NOT NULL,
    updated_by_user_id uuid
);

CREATE TABLE public.watchlist_item (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    deleted_at timestamp(6) without time zone,
    last_notified_at timestamp(6) without time zone,
    product_api_id character varying(255) NOT NULL,
    threshold_value double precision NOT NULL,
    updated_at timestamp(6) without time zone,
    watch_type character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    CONSTRAINT watchlist_item_watch_type_check CHECK (((watch_type)::text = ANY (ARRAY[('PERCENTAGE'::character varying)::text, ('ABSOLUTE'::character varying)::text])))
);

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.contact_message
    ADD CONSTRAINT contact_message_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pinned_place
    ADD CONSTRAINT pinned_place_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pinned_store
    ADD CONSTRAINT pinned_store_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.shopping_list_item
    ADD CONSTRAINT shopping_list_item_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.shopping_list
    ADD CONSTRAINT shopping_list_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pinned_store
    ADD CONSTRAINT uk3tjogto4487py76n4sbovoctx UNIQUE (user_id, store_api_id);

ALTER TABLE ONLY public.pinned_place
    ADD CONSTRAINT ukcfpmtsynsqoinn6thwoe0t48u UNIQUE (user_id, place_api_id);

ALTER TABLE ONLY public.watchlist_item
    ADD CONSTRAINT watchlist_item_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX ux_app_user_username ON public.app_user USING btree (username);

ALTER TABLE ONLY public.shopping_list_item
    ADD CONSTRAINT fk1et5nxqn9udm0cbbhco58cq12 FOREIGN KEY (shopping_list_id) REFERENCES public.shopping_list(id);

ALTER TABLE ONLY public.pinned_store
    ADD CONSTRAINT fk2at5nw70e20gjkh9afcmemku0 FOREIGN KEY (user_id) REFERENCES public.app_user(id);

ALTER TABLE ONLY public.contact_message
    ADD CONSTRAINT fk4kvarbmc1i472iugjx713gb6v FOREIGN KEY (user_id) REFERENCES public.app_user(id);

ALTER TABLE ONLY public.shopping_list_item
    ADD CONSTRAINT fk9hdnedx0cutwxocwvepxpmcun FOREIGN KEY (updated_by_user_id) REFERENCES public.app_user(id);

ALTER TABLE ONLY public.pinned_place
    ADD CONSTRAINT fkmpfubgk49fby282nvwekhhmb1 FOREIGN KEY (user_id) REFERENCES public.app_user(id);

ALTER TABLE ONLY public.shopping_list
    ADD CONSTRAINT fkmukq6fjeenpp7maigprns7p9o FOREIGN KEY (owner_id) REFERENCES public.app_user(id);

ALTER TABLE ONLY public.watchlist_item
    ADD CONSTRAINT fks9i20pmln3bu1va75e1sg188t FOREIGN KEY (user_id) REFERENCES public.app_user(id);

