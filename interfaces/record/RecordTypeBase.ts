export interface RecordTypeBase {
  ID?: string | null; // UID, Partition Key
  DataType?: string | null; // Sort Key
  Create?: number | null;
  Update?: number | null;
}
