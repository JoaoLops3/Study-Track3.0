// type Integration = Database["public"]["Tables"]["integrations"]["Row"];
interface Integration {
  id: string;
  provider: string;
  enabled: boolean;
  user_id: string;
}
