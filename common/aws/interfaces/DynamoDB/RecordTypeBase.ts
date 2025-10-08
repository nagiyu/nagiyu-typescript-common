/**
 * @deprecated Use @common/interfaces/record/RecordTypeBase instead
 */
export interface RecordTypeBase {
  ID: string; // UID, Partition Key
  DataType: string; // Sort Key
  Create: number;
  Update: number;
}
