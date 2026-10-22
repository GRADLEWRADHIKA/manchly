import { RunInitOptions } from "@hot-updater/cli-tools";
//#region iac/supabaseApi.d.ts
type SupabaseInfrastructureState = "fresh" | "incompatible" | "v1";
interface SupabaseApi {
  getInfrastructureState: () => Promise<SupabaseInfrastructureState>;
  listBuckets: () => Promise<{
    id: string;
    name: string;
    isPublic: boolean;
    createdAt: string;
  }[]>;
  createBucket: (bucketName: string, options: {
    public: boolean;
  }) => Promise<{
    name: string;
  }>;
}
//#endregion
//#region iac/init/index.d.ts
declare const SUPABASE_REGION_VALUES: readonly ["ap-east-1", "ap-northeast-1", "ap-northeast-2", "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ca-central-1", "eu-central-1", "eu-central-2", "eu-north-1", "eu-west-1", "eu-west-2", "eu-west-3", "sa-east-1", "us-east-1", "us-east-2", "us-west-1", "us-west-2"];
type SupabaseRegion = (typeof SUPABASE_REGION_VALUES)[number];
declare const initProvider: {
  readonly label: "Supabase";
  readonly inputs: {
    readonly projectId: {
      readonly envKey: "HOT_UPDATER_SUPABASE_PROJECT_ID";
      readonly help: "Supabase project reference";
    };
    readonly projectName: {
      readonly envKey: "HOT_UPDATER_SUPABASE_PROJECT_NAME";
      readonly help: "Project name used when creating a Supabase project";
      readonly optional: true;
      readonly prompt: {
        readonly defaultValue: "hot-updater";
        readonly message: "Enter a name for the new Supabase project";
        readonly placeholder: "hot-updater";
        readonly type: "text";
      };
    };
    readonly organizationSlug: {
      readonly envKey: "HOT_UPDATER_SUPABASE_ORGANIZATION_SLUG";
      readonly help: "Organization slug used when creating a Supabase project";
      readonly optional: true;
      readonly prompt: {
        readonly message: "Select a Supabase organization";
        readonly type: "select";
      };
    };
    readonly region: {
      readonly envKey: "HOT_UPDATER_SUPABASE_REGION";
      readonly help: "Region used when creating a Supabase project";
      readonly optional: true;
      readonly prompt: {
        readonly defaultValue: "us-east-1";
        readonly message: "Select a region for the new Supabase project";
        readonly type: "select";
      };
      readonly validate: (value: string | undefined) => value is SupabaseRegion;
    };
    readonly accessToken: {
      readonly envKey: "SUPABASE_ACCESS_TOKEN";
      readonly help: "Supabase personal access token";
      readonly persistence: "with-consent";
      readonly preflight: false;
      readonly prompt: {
        readonly message: "Enter your Supabase personal access token";
        readonly type: "password";
      };
    };
    readonly bucketName: {
      readonly envKey: "HOT_UPDATER_SUPABASE_BUCKET_NAME";
      readonly help: "Storage bucket name";
      readonly prompt: {
        readonly defaultValue: "hot-updater-storage";
        readonly message: "Enter a name for the new storage bucket";
        readonly placeholder: "hot-updater-storage";
        readonly type: "text";
      };
    };
    readonly functionName: {
      readonly envKey: "HOT_UPDATER_SUPABASE_FUNCTION_NAME";
      readonly help: "Edge Function name";
      readonly prompt: {
        readonly defaultValue: "hot-updater-v1";
        readonly message: "Enter a name for the edge function";
        readonly placeholder: "hot-updater-v1";
        readonly type: "text";
      };
      readonly validate: (value: string | undefined) => value is string;
    };
    readonly databasePassword: {
      readonly envKey: "HOT_UPDATER_SUPABASE_DB_PASSWORD";
      readonly help: "Database password, when required by the linked project";
      readonly optional: true;
      readonly persistence: "with-consent";
      readonly prompt: {
        readonly message: "Enter your Supabase database password (press Enter to skip if none)";
        readonly type: "password";
      };
    };
  };
};
//#endregion
//#region iac/supabaseManagementApi.d.ts
type SupabaseOrganization = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};
type SupabaseProject = {
  readonly id: string;
  readonly name: string;
  readonly region: string;
};
interface SupabaseManagementApi {
  createProject: (input: {
    readonly databasePassword: string;
    readonly name: string;
    readonly organizationSlug: string;
    readonly region: SupabaseRegion;
  }) => Promise<SupabaseProject>;
  getProjectStatus: (projectId: string) => Promise<string>;
  listFunctions: (projectId: string) => Promise<readonly string[]>;
  listOrganizations: () => Promise<readonly SupabaseOrganization[]>;
}
//#endregion
//#region iac/index.d.ts
/** The Edge Function URL an app sets as its baseURL. */
declare const getSupabaseFunctionUrl: ({ functionName, projectId }: {
  readonly functionName: string;
  readonly projectId: string;
}) => string;
declare const reportSupabaseOriginCatalogReady: () => void;
declare const resolveEdgeFunctionDenoConfig: (targetDir: string) => Promise<{
  imports: Record<string, string>;
}>;
type SupabaseProjectSelection = {
  readonly create: false;
  readonly project: SupabaseProject;
} | {
  readonly create: true;
};
declare const selectProject: (preferredProjectId?: string, nonInteractive?: boolean, accessToken?: string) => Promise<SupabaseProjectSelection>;
type SupabaseBucketSelection = {
  readonly create: false;
  readonly id: string;
  readonly isPublic: boolean;
  readonly name: string;
} | {
  readonly create: true;
  readonly name: string;
};
declare const selectBucket: (api: SupabaseApi, preferredBucketName?: string, nonInteractive?: boolean) => Promise<SupabaseBucketSelection>;
declare const createSelectedBucket: (api: SupabaseApi, selection: SupabaseBucketSelection) => Promise<{
  readonly id: string;
  readonly name: string;
}>;
declare const waitForSupabaseProjectReady: ({ getProjectStatus, maxAttempts, onLongWait, pollIntervalMs }: {
  readonly getProjectStatus: () => Promise<string>;
  readonly maxAttempts?: number;
  readonly onLongWait: () => void;
  readonly pollIntervalMs?: number;
}) => Promise<void>;
declare const waitForSupabaseSchemaReady: ({ getInfrastructureState, maxAttempts, pollIntervalMs }: {
  readonly getInfrastructureState: SupabaseApi["getInfrastructureState"];
  readonly maxAttempts?: number;
  readonly pollIntervalMs?: number;
}) => Promise<void>;
declare const getSupabaseProjectAccess: ({ accessToken, managementApi, project, waitForProject }: {
  readonly accessToken?: string;
  readonly managementApi: SupabaseManagementApi;
  readonly project: SupabaseProject;
  readonly waitForProject: boolean;
}) => Promise<{
  readonly api: SupabaseApi;
  readonly serviceRoleApiKey: string;
}>;
declare const withSupabaseCliMetadataCleanup: <Result>(cwd: string, operation: () => Promise<Result>) => Promise<Result>;
declare const runInit: (options: RunInitOptions) => Promise<void>;
//#endregion
export { SupabaseBucketSelection, SupabaseProjectSelection, createSelectedBucket, getSupabaseFunctionUrl, getSupabaseProjectAccess, initProvider, reportSupabaseOriginCatalogReady, resolveEdgeFunctionDenoConfig, runInit, selectBucket, selectProject, waitForSupabaseProjectReady, waitForSupabaseSchemaReady, withSupabaseCliMetadataCleanup };