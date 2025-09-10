export interface HasuraActionsPayload<
  Input extends object = Record<string, never>,
  Session extends object = Record<string, never>,
> {
  action: {
    name: string;
  };
  input: Input;
  session_variables: Session;
}

export interface HasuraActionsPayloadObject<
  Input extends object = Record<string, never>,
  Session extends object = Record<string, never>,
> {
  action: {
    name: string;
  };
  input: {
    input: Input;
  };
  session_variables: Session;
}
