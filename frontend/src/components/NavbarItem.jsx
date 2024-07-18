import React from 'react';

function NavbarItem({ name, Icon, iconSize }) {
  return (
    <div className="navbar-item">
      <Icon size={iconSize} />
      <h2 className="navbar-text">{name}</h2>
    </div>
  );
}

export default NavbarItem;

