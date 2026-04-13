const checkNotEmpty = (field: unknown, fieldName: string) => {
  if (!field || (typeof field === "string" && field.trim() === "")) {
    throw new Error(`${fieldName} is required!`);
  }
};

const checkIntegerNumber = (field: unknown, fieldName: string) => {
  if (!Number.isInteger(field)) {
    throw new Error(`${fieldName} must be an integer!`);
  }
};

export { checkNotEmpty, checkIntegerNumber};
