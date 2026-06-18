import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useTranslation } from "react-i18next";
import { COUNTRIES, inputBaseClasses } from "./countries";

const SelectChevron = () => (
  <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

export const DialPhoneField = ({
  phone,
  selectedDial,
  onPhoneChange,
  onDialChange,
  selectedCountryId,
  onCountryChange,
  label,
  required = false,
  labelClassName = 'text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm',
  inputClassName = inputBaseClasses,
  selectClassName = inputBaseClasses,
  selectWrapperClassName = 'w-[100px] sm:w-[120px]',
}) => {
  const { t } = useTranslation();
  const displayLabel = label !== undefined ? label : t('common.phone', { defaultValue: 'Contact phone' });

  return (
    <div className="space-y-1.5 sm:space-y-2">
      <Label htmlFor="phone" className={labelClassName}>
        {displayLabel} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex gap-2">
        <div className={`relative shrink-0 ${selectWrapperClassName}`}>
          <select
            value={selectedCountryId || selectedDial}
            onChange={(e) => {
              const country = COUNTRIES.find((item) => item.id === e.target.value);

              if (country) {
                onCountryChange?.(country.id);
                onDialChange(country.dial);
                return;
              }

              onDialChange(e.target.value);
            }}
            className={`${selectClassName} appearance-none pr-7 sm:pr-8 cursor-pointer text-[11px] sm:text-base`}
          >
            {COUNTRIES.map((country) => (
              <option key={`dial-${country.id}`} value={selectedCountryId ? country.id : country.dial}>
                {country.flag} {country.dial}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <SelectChevron />
          </div>
        </div>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(formatPhoneByDial(e.target.value, selectedDial))}
          placeholder="(999) 000-00-00"
          required={required}
          className={`${inputClassName} flex-1`}
        />
      </div>
    </div>
  );
};

export const stripPhoneDigits = (value) => `${value || ''}`.replace(/\D/g, '');

export const formatPhoneByDial = (value, dial) => {
  let digits = stripPhoneDigits(value);

  if (dial === '+7') {
    if (digits.length > 10 && (digits.startsWith('7') || digits.startsWith('8'))) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);
    return [
      digits.slice(0, 3) ? `(${digits.slice(0, 3)}` : '',
      digits.length >= 3 ? ') ' : '',
      digits.slice(3, 6),
      digits.slice(6, 8) ? `-${digits.slice(6, 8)}` : '',
      digits.slice(8, 10) ? `-${digits.slice(8, 10)}` : '',
    ].join('');
  }

  if (dial === '+1') {
    digits = digits.slice(0, 10);
    return [
      digits.slice(0, 3) ? `(${digits.slice(0, 3)}` : '',
      digits.length >= 3 ? ') ' : '',
      digits.slice(3, 6),
      digits.slice(6, 10) ? `-${digits.slice(6, 10)}` : '',
    ].join('');
  }

  if (['+375', '+998'].includes(dial)) {
    digits = digits.slice(0, 9);
    return [
      digits.slice(0, 2) ? `(${digits.slice(0, 2)}` : '',
      digits.length >= 2 ? ') ' : '',
      digits.slice(2, 5),
      digits.slice(5, 7) ? `-${digits.slice(5, 7)}` : '',
      digits.slice(7, 9) ? `-${digits.slice(7, 9)}` : '',
    ].join('');
  }

  if (['+996', '+994', '+992', '+995', '+374', '+371', '+373', '+372', '+370', '+357', '+993'].includes(dial)) {
    digits = digits.slice(0, 9);
    return [
      digits.slice(0, 3),
      digits.slice(3, 6) ? ` ${digits.slice(3, 6)}` : '',
      digits.slice(6, 9) ? `-${digits.slice(6, 9)}` : '',
    ].join('');
  }

  if (dial === '+972') {
    digits = digits.slice(0, 9);
    return [
      digits.slice(0, 2),
      digits.slice(2, 5) ? `-${digits.slice(2, 5)}` : '',
      digits.slice(5, 9) ? `-${digits.slice(5, 9)}` : '',
    ].join('');
  }

  if (dial === '+971') {
    digits = digits.slice(0, 9);
    return [
      digits.slice(0, 2),
      digits.slice(2, 5) ? ` ${digits.slice(2, 5)}` : '',
      digits.slice(5, 9) ? ` ${digits.slice(5, 9)}` : '',
    ].join('');
  }

  digits = digits.slice(0, 12);
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
};

export const CountryField = ({
  selectedCountry,
  onCountryChange,
  label,
  required = false,
}) => {
  const { t } = useTranslation();
  const displayLabel = label !== undefined ? label : t('common.country', { defaultValue: 'Country' });

  return (
    <div className="space-y-1.5 sm:space-y-2">
      <Label htmlFor="country" className="text-foreground font-medium ml-1 text-[11px] sm:text-xs sm:text-sm">
        {displayLabel} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <select
          id="country"
          value={selectedCountry}
          onChange={(e) => onCountryChange(e.target.value)}
          className={`${inputBaseClasses} pr-10 cursor-pointer text-[11px] sm:text-base`}
        >
          {COUNTRIES.map((country) => (
            <option key={country.id} value={country.id}>
              {country.flag} {t(`countries.${country.id}`, { defaultValue: country.name })}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
          <SelectChevron />
        </div>
      </div>
    </div>
  );
};
