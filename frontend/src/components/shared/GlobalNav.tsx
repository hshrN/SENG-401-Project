import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { RadialActionMenu, type RadialMenuItem } from "../radialMenu/RadialActionMenu";

type GlobalNavProps = {
  backTo?: string;
  backClassName: string;
  menuItems?: RadialMenuItem[];
  menuSize?: number;
};

export default function GlobalNav({
  backTo = "/",
  backClassName,
  menuItems,
  menuSize = 220,
}: GlobalNavProps) {
  if (menuItems && menuItems.length > 0) {
    return (
      <RadialActionMenu
        size={menuSize}
        triggerIcon={<Menu size={18} />}
        triggerAriaLabel="Open controls menu"
        items={menuItems}
      />
    );
  }

  return (
    <Link to={backTo} className={backClassName}>
      <ArrowLeft size={18} />
      Back to Home
    </Link>
  );
}

