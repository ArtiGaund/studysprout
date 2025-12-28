type VersionedFile = {
    version?: number;
    lastUpdated?: Date;
    updatedAtLocal?: Date;
    lastLocalChangeId?: number;
}

export function bumpFileVersion(file: VersionedFile){
    file.version = (file.version ?? 1) + 1;
    file.lastUpdated = new Date();
    file.updatedAtLocal = new Date();
    file.lastLocalChangeId = (file.lastLocalChangeId ?? 0) + 1;
}