import { getAvatarOption, getInitials } from '@/lib/avatarOptions';

type UserAvatarProps = {
  nome?: string | null;
  avatar?: string | null;
  className?: string;
  textClassName?: string;
};

function isImageAvatar(value?: string | null) {
  return Boolean(value && /^(https?:\/\/|\/|data:image\/)/.test(value));
}

export default function UserAvatar({
  nome,
  avatar,
  className = '',
  textClassName = '',
}: UserAvatarProps) {
  const option = getAvatarOption(avatar);
  const imageAvatar = isImageAvatar(avatar);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950 ${className}`}
      aria-hidden="true"
    >
      {option ? (
        <span className={`leading-none ${textClassName}`}>{option.emoji}</span>
      ) : imageAvatar ? (
        <img src={avatar || ''} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={textClassName}>{getInitials(nome)}</span>
      )}
    </span>
  );
}
