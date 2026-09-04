'use client';

import * as React from 'react';
import RPNInput, {
  getCountryCallingCode,
  parsePhoneNumber,
  type Country,
  type Value,
} from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import en from 'react-phone-number-input/locale/en.json';
import es from 'react-phone-number-input/locale/es.json';
import { ChevronDown, Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Input } from './input';

/**
 * International phone input: country selector (flag + calling code) plus a
 * formatted number field. Values are emitted in E.164 (`+18095551234`) so
 * they are unambiguous in the DB regardless of the country they belong to.
 */

const PhoneTextInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'>
>((props, ref) => <Input {...props} ref={ref} />);
PhoneTextInput.displayName = 'PhoneTextInput';

type CountryOption = { value?: Country; label: string; divider?: boolean };

interface CountrySelectProps {
  value?: Country;
  onChange: (value?: Country) => void;
  options: CountryOption[];
  disabled?: boolean;
  iconComponent: React.ComponentType<{ country: Country; label: string }>;
}

function CountrySelect({
  value,
  onChange,
  options,
  disabled,
  iconComponent: Flag,
}: CountrySelectProps) {
  return (
    <div
      className={cn(
        'border-input bg-background relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-2.5',
        'focus-within:ring-ring focus-within:ring-1',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className="flex h-4 w-6 items-center justify-center overflow-hidden rounded-[3px] [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_svg]:h-full [&_svg]:w-full">
        {value ? (
          <Flag country={value} label={value} />
        ) : (
          <Globe className="text-muted-foreground size-4" />
        )}
      </span>
      <ChevronDown className="text-muted-foreground size-3.5" />
      <select
        className="absolute inset-0 cursor-pointer opacity-0"
        value={value ?? ''}
        onChange={(e) => onChange((e.target.value || undefined) as Country)}
        disabled={disabled}
        aria-label="Country"
      >
        {options.map((option, index) =>
          option.divider ? (
            <option key={`divider-${index}`} disabled>
              ──────────
            </option>
          ) : (
            <option key={option.value ?? 'intl'} value={option.value ?? ''}>
              {option.label}
              {option.value ? ` (+${getCountryCallingCode(option.value)})` : ''}
            </option>
          ),
        )}
      </select>
    </div>
  );
}

interface PhoneInputProps {
  value?: string | null;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Legacy rows may hold formatted numbers ("+1 809 555 0134"); RPNInput only
 * accepts strict E.164, so normalise before handing the value over.
 */
function toE164(value?: string | null): Value | undefined {
  if (!value) return undefined;
  if (/^\+\d+$/.test(value)) return value as Value;
  return parsePhoneNumber(value)?.number ?? undefined;
}

export function PhoneInput({
  value,
  onChange,
  className,
  ...rest
}: PhoneInputProps) {
  const locale = useLocale();

  return (
    <RPNInput
      international
      defaultCountry="DO"
      countryOptionsOrder={['DO', 'US', '|', '...']}
      flags={flags}
      labels={locale === 'es' ? es : en}
      value={toE164(value)}
      onChange={(v) => onChange(v ?? '')}
      inputComponent={PhoneTextInput}
      countrySelectComponent={CountrySelect}
      className={cn('flex w-full gap-2', className)}
      {...rest}
    />
  );
}
