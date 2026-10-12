import { ChangeEvent, useState } from 'react';

export function useForm<T extends Record<string, any>>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const bind = (name: keyof T) => ({
    name: name as string,
    value: (values[name] ?? '') as any,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value })),
  });
  return { values, setValues, bind, set: (name: keyof T, value: any) => setValues((v) => ({ ...v, [name]: value })) };
}
