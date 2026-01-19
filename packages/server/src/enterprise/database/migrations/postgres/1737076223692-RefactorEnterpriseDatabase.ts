import { MigrationInterface, QueryRunner } from 'typeorm'
import { decrypt, encrypt } from '../../../utils/encryption.util'
import { LoginMethodStatus } from '../../entities/login-method.entity'
import { OrganizationUserStatus } from '../../entities/organization-user.entity'
import { OrganizationName } from '../../entities/organization.entity'
import { GeneralRole } from '../../entities/role.entity'
import { UserStatus } from '../../entities/user.entity'
import { WorkspaceUserStatus } from '../../entities/workspace-user.entity'
import { WorkspaceName } from '../../entities/workspace.entity'

export class RefactorEnterpriseDatabase1737076223692 implements MigrationInterface {
    name = 'RefactorEnterpriseDatabase1737076223692'
    private async modifyTable(queryRunner: QueryRunner): Promise<void> {
        /*-------------------------------------
        --------------- user -----------------
        --------------------------------------*/
        // rename user table to temp_user
        await queryRunner.query(`alter table "user" rename to "temp_user";`)

        // create user table
        await queryRunner.query(`
            create table "user" (
                "id" uuid default uuid_generate_v4() primary key,
                "name" varchar(100) not null,
                "email" varchar(255) not null,
                "credential" text null,
                "tempToken" text null,
                "tokenExpiry" timestamp null,
                "status" varchar(20) default '${UserStatus.UNVERIFIED}' not null,
                "createdDate" timestamp default now() not null,
                "updatedDate" timestamp default now() not null,
                "createdBy" uuid not null,
                "updatedBy" uuid not null,
                constraint "fk_createdBy" foreign key ("createdBy") references "user" ("id"),
                constraint "fk_updatedBy" foreign key ("updatedBy") references "user" ("id")
            );
        `)

        /*-------------------------------------
        ----------- organization --------------
        --------------------------------------*/
        // rename organization table to temp_organization
        await queryRunner.query(`alter table "organization" rename to "temp_organization";`)

        // create organization table
        await queryRunner.query(`
            create table "organization" (
                "id" uuid default uuid_generate_v4() primary key,
                "name" varchar(100) default '${OrganizationName.DEFAULT_ORGANIZATION}' not null,
                "customerId" varchar(100) null,
                "subscriptionId" varchar(100) null,
                "createdDate" timestamp default now() not null,
                "updatedDate" timestamp default now() not null,
                "createdBy" uuid not null,
                "updatedBy" uuid not null,
                constraint "fk_createdBy" foreign key ("createdBy") references "user" ("id"),
                constraint "fk_updatedBy" foreign key ("updatedBy") references "user" ("id")
            );
        `)

        /*-------------------------------------
        ----------- login method --------------
        --------------------------------------*/
        // create login_method table
        await queryRunner.query(`
            create table "login_method" (
                "id" uuid default uuid_generate_v4() primary key,
                "organizationId" uuid null,
                "name" varchar(100) not null,
                "config" text not null,
                "status" varchar(20) default '${LoginMethodStatus.ENABLE}'  not null,
                "createdDate" timestamp default now() not null,
                "updatedDate" timestamp default now() not null,
                "createdBy" uuid null,
                "updatedBy" uuid null,
                constraint "fk_organizationId" foreign key ("organizationId") references "organization" ("id"),
                constraint "fk_createdBy" foreign key ("createdBy") references "user" ("id"),
                constraint "fk_updatedBy" foreign key ("updatedBy") references "user" ("id")
            );
        `)

        /*-------------------------------------
        --------------- role ------------------
        --------------------------------------*/
        // Check if roles table exists (may not exist in AAI schema)
        const rolesTableExists = await queryRunner.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roles')
        `)
        if (rolesTableExists[0].exists) {
            // rename roles table to temp_role
            await queryRunner.query(`alter table "roles" rename to "temp_role";`)
        }

        // create role table
        await queryRunner.query(`
            create table "role" (
                "id" uuid default uuid_generate_v4() primary key,
                "organizationId" uuid null,
                "name" varchar(100) not null,
                "description" text null,
                "permissions" text not null,
                "createdDate" timestamp default now() not null,
                "updatedDate" timestamp default now() not null,
                "createdBy" uuid null,
                "updatedBy" uuid null,
                constraint "fk_organizationId" foreign key ("organizationId") references "organization" ("id"),
                constraint "fk_createdBy" foreign key ("createdBy") references "user" ("id"),
                constraint "fk_updatedBy" foreign key ("updatedBy") references "user" ("id")
            );
        `)

        /*-------------------------------------
        ---------- organization_user ----------
        --------------------------------------*/
        // create organization_user table
        await queryRunner.query(`
            create table "organization_user" (
                "organizationId" uuid not null,
                "userId" uuid not null,
                "roleId" uuid not null,
                "status" varchar(20) default '${OrganizationUserStatus.ACTIVE}' not null,
                "createdDate" timestamp default now() not null,
                "updatedDate" timestamp default now() not null,
                "createdBy" uuid not null,
                "updatedBy" uuid not null,
                constraint "pk_organization_user" primary key ("organizationId", "userId"),
                constraint "fk_organizationId" foreign key ("organizationId") references "organization" ("id"),
                constraint "fk_userId" foreign key ("userId") references "user" ("id"),
                constraint "fk_roleId" foreign key ("roleId") references "role" ("id"),
                constraint "fk_createdBy" foreign key ("createdBy") references "user" ("id"),
                constraint "fk_updatedBy" foreign key ("updatedBy") references "user" ("id")
            );
        `)

        /*-------------------------------------
        ------------- workspace ---------------
        --------------------------------------*/
        // Check if workspace table exists (may not exist in AAI schema)
        const workspaceTableExists = await queryRunner.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workspace')
        `)
        if (workspaceTableExists[0].exists) {
            // Check if constraint exists before trying to drop it
            const constraintExists = await queryRunner.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.table_constraints
                    WHERE constraint_name = 'fk_workspace_organizationId' AND table_name = 'workspace'
                )
            `)
            if (constraintExists[0].exists) {
                await queryRunner.query(`alter table "workspace" drop constraint "fk_workspace_organizationId";`)
            }

            // modify workspace table - check if columns need to be added
            const workspaceColumns = await queryRunner.query(`
                SELECT column_name FROM information_schema.columns WHERE table_name = 'workspace'
            `)
            const columnNames = workspaceColumns.map((col: { column_name: string }) => col.column_name)

            if (!columnNames.includes('createdBy')) {
                await queryRunner.query(`alter table "workspace" add column "createdBy" uuid null;`)
            }
            if (!columnNames.includes('updatedBy')) {
                await queryRunner.query(`alter table "workspace" add column "updatedBy" uuid null;`)
            }

            // Add foreign key constraints if they don't exist
            await queryRunner.query(`
                do $$ begin
                    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_createdBy' and table_name = 'workspace') then
                        alter table "workspace" add constraint "fk_createdBy" foreign key ("createdBy") references "user" ("id");
                    end if;
                end $$;
            `)
            await queryRunner.query(`
                do $$ begin
                    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_updatedBy' and table_name = 'workspace') then
                        alter table "workspace" add constraint "fk_updatedBy" foreign key ("updatedBy") references "user" ("id");
                    end if;
                end $$;
            `)

            // remove index if it exists
            await queryRunner.query(`drop index if exists "idx_workspace_organizationId";`)
        }

        /*-------------------------------------
        ----------- workspace_user ------------
        --------------------------------------*/
        // Check if workspace_users table exists
        const workspaceUsersExists = await queryRunner.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workspace_users')
        `)
        if (workspaceUsersExists[0].exists) {
            // rename workspace_users table to temp_workspace_user
            await queryRunner.query(`alter table "workspace_users" rename to "temp_workspace_user";`)
        }

        // create workspace_user table
        await queryRunner.query(`
            create table "workspace_user" (
                "workspaceId" uuid not null,
                "userId" uuid not null,
                "roleId" uuid not null,
                "status" varchar(20) default '${WorkspaceUserStatus.INVITED}' not null,
                "lastLogin" timestamp null,
                "createdDate" timestamp default now() not null,
                "updatedDate" timestamp default now() not null,
                "createdBy" uuid not null,
                "updatedBy" uuid not null,
                constraint "pk_workspace_user" primary key ("workspaceId", "userId"),
                constraint "fk_workspaceId" foreign key ("workspaceId") references "workspace" ("id"),
                constraint "fk_userId" foreign key ("userId") references "user" ("id"),
                constraint "fk_roleId" foreign key ("roleId") references "role" ("id"),
                constraint "fk_createdBy" foreign key ("createdBy") references "user" ("id"),
                constraint "fk_updatedBy" foreign key ("updatedBy") references "user" ("id")
            );
        `)
    }

    private async deleteWorkspaceWithoutUser(queryRunner: QueryRunner) {
        const workspaceWithoutUser = await queryRunner.query(`
            select w."id" as "id" from "workspace_user" as "wu"
            right join "workspace" as "w" on "wu"."workspaceId" = "w"."id"
            where "wu"."userId" is null;
        `)
        const workspaceIds = workspaceWithoutUser.map((workspace: { id: string }) => `'${workspace.id}'`).join(',')

        // Delete related records from other tables that reference the deleted workspaces
        if (workspaceIds && workspaceIds.length > 0) {
            await queryRunner.query(`
                delete from "workspace_user" where "workspaceId" in (${workspaceIds});
            `)
            await queryRunner.query(`
                delete from "apikey" where "workspaceId" in (${workspaceIds});
            `)
            await queryRunner.query(`
                delete from "assistant" where "workspaceId" in (${workspaceIds});
            `)
            const chatflows = await queryRunner.query(`
                select id from "chat_flow" where "workspaceId" in (${workspaceIds});
            `)
            const chatflowIds = chatflows.map((chatflow: { id: string }) => `'${chatflow.id}'`).join(',')
            if (chatflowIds && chatflowIds.length > 0) {
                await queryRunner.query(`
                    delete from "chat_flow" where "workspaceId" in (${workspaceIds});
                `)
                await queryRunner.query(`
                    delete from "upsert_history" where "chatflowid" in (${chatflowIds});
                `)
                await queryRunner.query(`
                    delete from "chat_message" where "chatflowid" in (${chatflowIds});
                `)
                await queryRunner.query(`
                    delete from "chat_message_feedback" where "chatflowid" in (${chatflowIds});
                `)
            }
            await queryRunner.query(`
                delete from "credential" where "workspaceId" in (${workspaceIds});
            `)
            await queryRunner.query(`
                delete from "custom_template" where "workspaceId" in (${workspaceIds});
            `)
            const datasets = await queryRunner.query(`
                select id from "dataset" where "workspaceId" in (${workspaceIds});
            `)
            const datasetIds = datasets.map((dataset: { id: string }) => `'${dataset.id}'`).join(',')
            if (datasetIds && datasetIds.length > 0) {
                await queryRunner.query(`
                    delete from "dataset" where "workspaceId" in (${workspaceIds});
                `)
                await queryRunner.query(`
                    delete from "dataset_row" where "datasetId" in (${datasetIds});
                `)
            }
            const documentStores = await queryRunner.query(`    
                select id from "document_store" where "workspaceId" in (${workspaceIds});
            `)
            const documentStoreIds = documentStores.map((documentStore: { id: string }) => `'${documentStore.id}'`).join(',')
            if (documentStoreIds && documentStoreIds.length > 0) {
                await queryRunner.query(`
                    delete from "document_store" where "workspaceId" in (${workspaceIds});
                `)
                await queryRunner.query(`
                    delete from "document_store_file_chunk" where "storeId" in (${documentStoreIds});
                `)
            }
            const evaluations = await queryRunner.query(`
                select id from "evaluation" where "workspaceId" in (${workspaceIds});
            `)
            const evaluationIds = evaluations.map((evaluation: { id: string }) => `'${evaluation.id}'`).join(',')
            if (evaluationIds && evaluationIds.length > 0) {
                await queryRunner.query(`
                    delete from "evaluation" where "workspaceId" in (${workspaceIds});
                `)
                await queryRunner.query(`
                    delete from "evaluation_run" where "evaluationId" in (${evaluationIds});
                `)
            }
            await queryRunner.query(`
                delete from "evaluator" where "workspaceId" in (${workspaceIds});
            `)
            await queryRunner.query(`
                delete from "tool" where "workspaceId" in (${workspaceIds});
            `)
            await queryRunner.query(`
                delete from "variable" where "workspaceId" in (${workspaceIds});
            `)
            await queryRunner.query(`
                delete from "workspace_shared" where "workspaceId" in (${workspaceIds});
            `)
            await queryRunner.query(`
                delete from "workspace" where "id" in (${workspaceIds});
            `)
        }
    }

    private async populateTable(queryRunner: QueryRunner): Promise<void> {
        // insert generalRole
        const generalRole = [
            {
                name: 'owner',
                description: 'Has full control over the organization.',
                permissions: '["organization","workspace"]'
            },
            {
                name: 'member',
                description: 'Has limited control over the organization.',
                permissions: '[]'
            },
            {
                name: 'personal workspace',
                description: 'Has full control over the personal workspace',
                permissions:
                    '[ "chatflows:view", "chatflows:create", "chatflows:update", "chatflows:duplicate", "chatflows:delete", "chatflows:export", "chatflows:import", "chatflows:config", "chatflows:domains", "agentflows:view", "agentflows:create", "agentflows:update", "agentflows:duplicate", "agentflows:delete", "agentflows:export", "agentflows:import", "agentflows:config", "agentflows:domains", "tools:view", "tools:create", "tools:update", "tools:delete", "tools:export", "assistants:view", "assistants:create", "assistants:update", "assistants:delete", "credentials:view", "credentials:create", "credentials:update", "credentials:delete", "credentials:share", "variables:view", "variables:create", "variables:update", "variables:delete", "apikeys:view", "apikeys:create", "apikeys:update", "apikeys:delete", "apikeys:import", "documentStores:view", "documentStores:create", "documentStores:update", "documentStores:delete", "documentStores:add-loader", "documentStores:delete-loader", "documentStores:preview-process", "documentStores:upsert-config", "datasets:view", "datasets:create", "datasets:update", "datasets:delete", "evaluators:view", "evaluators:create", "evaluators:update", "evaluators:delete", "evaluations:view", "evaluations:create", "evaluations:update", "evaluations:delete", "evaluations:run", "templates:marketplace", "templates:custom", "templates:custom-delete", "templates:toolexport", "templates:flowexport", "templates:custom-share", "workspace:export", "workspace:import", "executions:view", "executions:delete" ]'
            }
        ]
        for (let role of generalRole) {
            await queryRunner.query(`
                insert into "role"("name", "description", "permissions")
                values('${role.name}', '${role.description}', '${role.permissions}');
            `)
        }

        const users = await queryRunner.query('select * from "temp_user";')
        const noExistingData = users.length > 0 === false
        if (noExistingData) return

        // Check if this is AAI schema (has auth0Id but no credential column in temp_user)
        const tempUserColumns = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'temp_user'
        `)
        const columnNames = tempUserColumns.map((col: { column_name: string }) => col.column_name)
        const isAAISchema = columnNames.includes('auth0Id') && !columnNames.includes('credential')

        if (isAAISchema) {
            console.log('Detected AAI schema - using AAI-specific data migration')
            await this.populateTableAAI(queryRunner, users)
            return
        }

        const organizations = await queryRunner.query('select * from "temp_organization";')
        const organizationId = organizations[0].id
        const adminUserId = organizations[0].adminUserId
        const ssoConfig = organizations[0].sso_config ? JSON.parse(await decrypt(organizations[0].sso_config)).providers : []

        /*-------------------------------------
        --------------- user -----------------
        --------------------------------------*/
        // insert user with temp_user data
        await queryRunner.query(`
            insert into "user" ("id", "name", "email", "credential", "tempToken", "tokenExpiry", "status", "createdBy", "updatedBy")
            select tu."id", coalesce(tu."name", tu."email"), tu."email", tu."credential", tu."tempToken", tu."tokenExpiry", tu."status",
            '${adminUserId}', '${adminUserId}'
            from "temp_user" as "tu";
        `)

        /*-------------------------------------
        ----------- organization --------------
        --------------------------------------*/
        // insert organization with temp_organization data
        await queryRunner.query(`
            insert into "organization" ("id", "name", "createdBy", "updatedBy")
            select "id", "name", "adminUserId"::uuid, "adminUserId"::uuid from "temp_organization";
        `)

        /*-------------------------------------
        ----------- login method --------------
        --------------------------------------*/
        // insert login_method with temp_organization data
        for (let config of ssoConfig) {
            const newConfigFormat = {
                domain: config.domain === '' || config.domain === undefined ? undefined : config.domain,
                tenantID: config.tenantID === '' || config.tenantID === undefined ? undefined : config.tenantID,
                clientID: config.clientID === '' || config.clientID === undefined ? undefined : config.clientID,
                clientSecret: config.clientSecret === '' || config.clientSecret === undefined ? undefined : config.clientSecret
            }
            const status = config.configEnabled === true ? LoginMethodStatus.ENABLE : LoginMethodStatus.DISABLE

            const allUndefined = Object.values(newConfigFormat).every((value) => value === undefined)
            if (allUndefined && status === LoginMethodStatus.DISABLE) continue
            const encryptData = await encrypt(JSON.stringify(newConfigFormat))

            await queryRunner.query(`
                insert into "login_method" ("organizationId", "name", "config", "status", "createdBy", "updatedBy")
                values('${organizationId}','${config.providerName}','${encryptData}','${status}','${adminUserId}','${adminUserId}');
            `)
        }

        /*-------------------------------------
        --------------- role ------------------
        --------------------------------------*/
        // insert workspace role  into role
        const workspaceRole = await queryRunner.query(`select "id", "name", "description", "permissions" from "temp_role";`)
        for (let role of workspaceRole) {
            role.permissions = JSON.stringify(role.permissions.split(',').filter((permission: string) => permission.trim() !== ''))
            const haveDescriptionQuery = `insert into "role" ("id", "organizationId", "name", "description", "permissions", "createdBy", "updatedBy")
            values('${role.id}','${organizationId}','${role.name}','${role.description}','${role.permissions}','${adminUserId}','${adminUserId}');`
            const noHaveDescriptionQuery = `insert into "role" ("id", "organizationId", "name", "permissions", "createdBy", "updatedBy")
            values('${role.id}','${organizationId}','${role.name}','${role.permissions}','${adminUserId}','${adminUserId}');`
            const insertRoleQuery = role.description ? haveDescriptionQuery : noHaveDescriptionQuery
            await queryRunner.query(insertRoleQuery)
        }

        /*-------------------------------------
        ---------- organization_user ----------
        --------------------------------------*/
        const roles = await queryRunner.query('select * from "role";')
        // insert organization_user with user, role and temp_organization data
        for (let user of users) {
            const roleId =
                user.id === adminUserId
                    ? roles.find((role: any) => role.name === GeneralRole.OWNER).id
                    : roles.find((role: any) => role.name === GeneralRole.MEMBER).id
            await queryRunner.query(`
                insert into "organization_user" ("organizationId", "userId", "roleId", "status", "createdBy", "updatedBy")
                values ('${organizationId}','${user.id}','${roleId}','${user.status}','${adminUserId}','${adminUserId}');
            `)
        }

        /*-------------------------------------
        ------------- workspace ---------------
        --------------------------------------*/
        const workspaces = await queryRunner.query('select * from "workspace";')
        for (let workspace of workspaces) {
            await queryRunner.query(
                `update "workspace" set "createdBy" = '${adminUserId}', "updatedBy" = '${adminUserId}' where "id" = '${workspace.id}';`
            )
        }

        /*-------------------------------------
        ----------- workspace_user ------------
        --------------------------------------*/
        const workspaceUsers = await queryRunner.query('select * from "temp_workspace_user";')
        for (let workspaceUser of workspaceUsers) {
            switch (workspaceUser.role) {
                case 'org_admin':
                    workspaceUser.role = roles.find((role: any) => role.name === GeneralRole.OWNER).id
                    break
                case 'pw':
                    workspaceUser.role = roles.find((role: any) => role.name === GeneralRole.PERSONAL_WORKSPACE).id
                    break
                default:
                    workspaceUser.role = roles.find((role: any) => role.name === workspaceUser.role).id
                    break
            }
            const user = users.find((user: any) => user.id === workspaceUser.userId)
            const workspace = workspaces.find((workspace: any) => workspace.id === workspaceUser.workspaceId)
            if (workspaceUser.workspaceId === user.activeWorkspaceId && user.lastLogin) {
                const lastLogin = new Date(user.lastLogin).toISOString()
                await queryRunner.query(`
                    insert into "workspace_user" ("workspaceId", "userId", "roleId", "status", "lastLogin","createdBy", "updatedBy")
                    values ('${workspaceUser.workspaceId}','${workspaceUser.userId}','${workspaceUser.role}','${WorkspaceUserStatus.ACTIVE}','${lastLogin}','${adminUserId}','${adminUserId}');
                `)
            } else if (workspace.name === WorkspaceName.DEFAULT_PERSONAL_WORKSPACE && !user.lastLogin) {
                // Skip personal workspaces for users who haven't signed up yet to avoid duplicates when they sign up.
                // account.service.ts creates personal workspace during sign-up.
                await queryRunner.query(`
                    delete from "temp_workspace_user" where "workspaceId" = '${workspaceUser.workspaceId}' and "userId" = '${workspaceUser.userId}';
                `)
                await queryRunner.query(`
                    delete from "workspace" where "id" = '${workspaceUser.workspaceId}';
                `)
            } else {
                await queryRunner.query(`
                    insert into "workspace_user" ("workspaceId", "userId", "roleId", "status","createdBy", "updatedBy")
                    values ('${workspaceUser.workspaceId}','${workspaceUser.userId}','${workspaceUser.role}','${WorkspaceUserStatus.INVITED}','${adminUserId}','${adminUserId}');
                `)
            }
        }

        await this.deleteWorkspaceWithoutUser(queryRunner)
    }

    /**
     * AAI-specific data migration - handles the different AAI schema
     * AAI user table has: id, auth0Id, email, name, createdDate, updatedDate
     * AAI organization table has: id, auth0Id, name, createdDate, updatedDate
     */
    private async populateTableAAI(queryRunner: QueryRunner, users: any[]): Promise<void> {
        // Use first user as admin
        const firstUserId = users[0].id

        // Get organizations from temp table
        const organizations = await queryRunner.query('select * from "temp_organization";')

        /*-------------------------------------
        --------------- user -----------------
        --------------------------------------*/
        // Insert users with AAI schema (no credential, tempToken, tokenExpiry, status columns)
        await queryRunner.query(`
            insert into "user" ("id", "name", "email", "status", "createdBy", "updatedBy")
            select tu."id", coalesce(tu."name", tu."email"), tu."email", '${UserStatus.ACTIVE}',
            '${firstUserId}', '${firstUserId}'
            from "temp_user" as "tu";
        `)
        console.log('AAI users migrated to new user table')

        /*-------------------------------------
        ----------- organization --------------
        --------------------------------------*/
        // Insert organizations with AAI schema
        if (organizations.length > 0) {
            await queryRunner.query(`
                insert into "organization" ("id", "name", "createdBy", "updatedBy")
                select "id", "name", '${firstUserId}', '${firstUserId}' from "temp_organization";
            `)
            console.log('AAI organizations migrated to new organization table')
        }

        /*-------------------------------------
        ---------- organization_user ----------
        --------------------------------------*/
        const roles = await queryRunner.query('select * from "role";')
        const ownerRoleId = roles.find((role: any) => role.name === GeneralRole.OWNER)?.id
        const memberRoleId = roles.find((role: any) => role.name === GeneralRole.MEMBER)?.id

        // For AAI, we need to link users to their organizations
        // AAI users have organizationId column that links them to organizations
        const tempUserColumns = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'temp_user'
        `)
        const hasOrgIdColumn = tempUserColumns.some((col: { column_name: string }) => col.column_name === 'organizationId')

        if (hasOrgIdColumn && organizations.length > 0) {
            // Get list of valid organization IDs that were actually migrated
            const migratedOrgs = await queryRunner.query('select "id" from "organization";')
            const validOrgIds = new Set(migratedOrgs.map((org: { id: string }) => org.id))
            const fallbackOrgId = organizations[0].id

            for (let user of users) {
                // First user is owner, others are members
                const roleId = user.id === firstUserId ? ownerRoleId : memberRoleId

                // Use user's orgId only if it exists in the migrated organizations
                // Otherwise fall back to first organization
                let orgId = user.organizationId
                if (!orgId || !validOrgIds.has(orgId)) {
                    console.log(`User ${user.id} has invalid organizationId ${orgId}, using fallback ${fallbackOrgId}`)
                    orgId = fallbackOrgId
                }

                await queryRunner.query(`
                    insert into "organization_user" ("organizationId", "userId", "roleId", "status", "createdBy", "updatedBy")
                    values ('${orgId}','${user.id}','${roleId}','${OrganizationUserStatus.ACTIVE}','${firstUserId}','${firstUserId}')
                    on conflict ("organizationId", "userId") do nothing;
                `)
            }
            console.log('AAI organization_user relationships created')
        }

        // Skip workspace_user migration for AAI as the workspace system is handled differently
        // The CreateAAIWorkspaces migration will set up workspaces for AAI users
        console.log('Skipping workspace_user migration for AAI schema - will be handled by CreateAAIWorkspaces')
    }

    private async deleteTempTable(queryRunner: QueryRunner): Promise<void> {
        // Use IF EXISTS for AAI compatibility - some tables may not exist
        await queryRunner.query(`drop table if exists "temp_workspace_user";`)
        await queryRunner.query(`drop table if exists "temp_role";`)
        await queryRunner.query(`drop table if exists "temp_organization";`)
        await queryRunner.query(`drop table if exists "temp_user";`)
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.modifyTable(queryRunner)
        await this.populateTable(queryRunner)
        await this.deleteTempTable(queryRunner)

        // Check if workspace table exists before final modifications
        const workspaceTableExists = await queryRunner.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workspace')
        `)
        if (workspaceTableExists[0].exists) {
            // This query cannot be part of the modifyTable function because:
            // 1. The "organizationId" in the "workspace" table might be referencing data in the "temp_organization" table, so it must be altered last.
            // 2. Setting "createdBy" and "updatedBy" to NOT NULL needs to happen after ensuring there's no existing data that would violate the constraint,
            //    because altering these columns while there is data could prevent new records from being inserted into the "workspace" table.

            // Check if columns are already NOT NULL before trying to set them
            const columnInfo = await queryRunner.query(`
                SELECT column_name, is_nullable FROM information_schema.columns
                WHERE table_name = 'workspace' AND column_name IN ('createdBy', 'updatedBy')
            `)

            for (const col of columnInfo) {
                if (col.is_nullable === 'YES') {
                    // First update any NULL values to a valid user ID
                    const firstUser = await queryRunner.query(`SELECT id FROM "user" LIMIT 1`)
                    if (firstUser.length > 0) {
                        await queryRunner.query(`UPDATE "workspace" SET "${col.column_name}" = '${firstUser[0].id}' WHERE "${col.column_name}" IS NULL`)
                    }
                    await queryRunner.query(`ALTER TABLE "workspace" ALTER COLUMN "${col.column_name}" SET NOT NULL;`)
                }
            }

            // Add fk_organizationId constraint if it doesn't exist
            await queryRunner.query(`
                do $$ begin
                    if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_organizationId' and table_name = 'workspace') then
                        alter table "workspace" add constraint "fk_organizationId" foreign key ("organizationId") references "organization" ("id");
                    end if;
                end $$;
            `)
        }
    }

    public async down(): Promise<void> {}
}
