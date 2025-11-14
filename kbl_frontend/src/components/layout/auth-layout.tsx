import React from 'react';


const KblLogoBox = () => (
  <div className="bg-kbl-deep text-white font-heading font-bold text-2xl p-4 rounded-md">
    KBL
  </div>
);

export const AuthLayout = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <KblLogoBox />
        </div>
        <h1 className="font-heading text-3xl text-center uppercase text-kbl-deep tracking-wider mb-8">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
};