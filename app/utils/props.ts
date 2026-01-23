export const requireObservationProp = requireProp<FullObservation>();
export const requireObservationsProp = requireProp<FullObservation[]>();
export const requireProjectProp = requireProp<FullProject>();
export const requireCollaboratorProp = requireProp<Collaborator>();

export const requireModalProps = {
  open: requireProp<boolean>(Boolean),
  onClose: requireProp<() => void>(Function),
};
export function requireFunctionProp<T extends Function>() {
  return requireProp<T>(Function);
}
export function requireProp<T>(
  type: StringConstructor | NumberConstructor | ArrayConstructor | BooleanConstructor | ObjectConstructor | FunctionConstructor = Object,
): Readonly<{
  required: true,
  type: PropType<T>
}> {
  return Object.freeze({
    required: true,
    type: type as PropType<T>
  });
};