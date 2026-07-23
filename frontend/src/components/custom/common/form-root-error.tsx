interface IFormRootErrorProps {
  message?: string;
}

export default function FormRootError({ message }: IFormRootErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3"
    >
      {message}
    </div>
  );
}
