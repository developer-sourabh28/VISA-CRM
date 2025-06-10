import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';

export default function AdminSettings() {
  const navigate = useNavigate();

  const settings = [
    // {
    //   name: 'Destination',
    //   path: '/admin/destination',
    //   img: 'https://i.pinimg.com/736x/0f/83/82/0f8382eca17d6d67507d1859361bc39e.jpg',
    // },
    // {
    //   name: 'Hotel',
    //   path: '/admin/hotel',
    //   img: 'https://i.pinimg.com/736x/a1/06/c7/a106c7e0256afac9d2e4295c42bf0163.jpg',
    // },
    // {
    //   name: 'Flight',
    //   path: '/admin/flight',
    //   img: 'https://i.pinimg.com/736x/af/b8/f5/afb8f5188049b070c1bf41b560a21d99.jpg',
    // },
    {
      name: 'Role Setting',
      path: '/admin/role-setting',
      img: 'https://i.pinimg.com/736x/6b/88/45/6b8845b62a26de15786e2839cfb87993.jpg',
    },
    {
      title: 'Email Templates',
      path: '/admin/email-templates',
      icon: Mail,
    },
    {
      name: 'Currency',
      path: '/admin/currency',
      img: 'https://i.pinimg.com/736x/77/bd/27/77bd27cc92ae7fda378fe1261220c0a4.jpg',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {settings.map(({ name, path, img }) => (
          <div
            key={name}
            onClick={() => navigate(path)}
            className="relative h-40 rounded-xl cursor-pointer overflow-hidden shadow-lg group"
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xl font-bold drop-shadow-lg">
                {name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
