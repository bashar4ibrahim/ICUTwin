import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiChevronDown,
  FiUser,
  FiLogOut,
  FiMoon,
  FiSun,
  FiSettings,
  FiHelpCircle,
} from 'react-icons/fi';
import './AppNavbar.css';

const formatRole = (role) =>
  String(role || 'clinician')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AppNavbar({
  navItems = [],
  currentPage,
  currentItem,
  onNavigate,
  onOpenSettings,
  onOpenHelp,
  onToggleTheme,
  themeMode,
  effectiveTheme,
  user,
  onLogout,
}) {
  const [activeSection, setActiveSection] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState({ left: 0, width: 0, height: 0 });
  const [arrowLeft, setArrowLeft] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navRef = useRef(null);
  const dropdownRef = useRef(null);
  const buttonRefs = useRef({});
  const sectionRefs = useRef({});
  const closeTimerRef = useRef(null);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Group nav items by section
  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});
  const sections = Object.keys(groupedItems);

  // Clear any pending close timer
  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  // Open dropdown immediately
  const handleMouseEnterSection = (section) => {
    clearCloseTimer();
    setIsTransitioning(true);
    setActiveSection(section);
  };

  // Close dropdown with a small delay (allows moving to dropdown)
  const handleMouseLeaveNav = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setActiveSection(null);
      setIsTransitioning(false);
    }, 150);
  };

  // Cancel close if mouse enters dropdown area
  const handleMouseEnterDropdown = () => {
    clearCloseTimer();
  };

  // Update dropdown position when active section changes
  useEffect(() => {
    if (!activeSection) return;

    const button = buttonRefs.current[activeSection];
    const section = sectionRefs.current[activeSection];
    const dropdown = dropdownRef.current;
    const nav = navRef.current;

    if (!button || !section || !dropdown || !nav) return;

    const buttonRect = button.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();

    const minWidth = 340;
    const contentWidth = Math.max(sectionRect.width, minWidth);
    const contentHeight = sectionRect.height + 40;

    const buttonCenter = buttonRect.left - navRect.left + buttonRect.width / 2;
    const dropdownLeft = buttonCenter - contentWidth / 2;
    const maxLeft = navRect.width - contentWidth - 20;
    const clampedLeft = Math.max(20, Math.min(dropdownLeft, maxLeft));

    setDropdownStyle({
      left: clampedLeft,
      width: contentWidth,
      height: contentHeight,
    });

    const arrowX = buttonCenter - clampedLeft - 7;
    setArrowLeft(arrowX);
  }, [activeSection]);

  return (
    <header
      className={`app-navbar-premium ${scrolled ? 'scrolled' : ''}`}
      ref={navRef}
      onMouseLeave={handleMouseLeaveNav}
    >
      <div className="navbar-container">
        {/* Brand */}
        <motion.div
          className="brand-section"
          onClick={() => onNavigate('dashboard')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="brand-icon">🧬</span>
          <span className="brand-text">ICU Twin</span>
        </motion.div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          {sections.map((section) => (
            <button
              key={section}
              ref={(el) => (buttonRefs.current[section] = el)}
              className={`nav-button ${activeSection === section ? 'active' : ''}`}
              onMouseEnter={() => handleMouseEnterSection(section)}
            >
              <span>{section}</span>
              <FiChevronDown className="chevron" />
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions">
          <motion.button
            className="icon-button"
            onClick={onToggleTheme}
            title="Toggle theme"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {effectiveTheme === 'dark' ? <FiSun /> : <FiMoon />}
          </motion.button>
          <motion.button
            className="icon-button"
            onClick={onOpenSettings}
            title="Settings"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSettings />
          </motion.button>
          <motion.button
            className="icon-button"
            onClick={onOpenHelp}
            title="Help"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiHelpCircle />
          </motion.button>
          <div className="user-profile">
            <div className="user-avatar">
              <FiUser />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.full_name || 'Doctor'}</span>
              <span className="user-role">{formatRole(user?.role)}</span>
            </div>
            <motion.button
              className="logout-button"
              onClick={onLogout}
              title="Sign out"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiLogOut />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Dropdown Mega-Menu */}
      <AnimatePresence>
        {activeSection && (
          <motion.div
            className="dropdown-wrapper"
            style={{ left: dropdownStyle.left }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onMouseEnter={handleMouseEnterDropdown}
          >
            <div className="dropdown-arrow" style={{ left: arrowLeft }} />
            <div
              ref={dropdownRef}
              className="dropdown-menu"
              style={{
                width: dropdownStyle.width,
                height: dropdownStyle.height,
                transition: isTransitioning
                  ? 'all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1)'
                  : 'none',
              }}
            >
              {sections.map((section) => (
                <div
                  key={section}
                  ref={(el) => (sectionRefs.current[section] = el)}
                  className={`dropdown-section ${activeSection === section ? 'active' : ''}`}
                >
                  <div className="section-header">
                    <span className="section-title">{section}</span>
                  </div>
                  <div className="section-items">
                    {groupedItems[section].map((item) => (
                      <motion.button
                        key={item.id}
                        className={`dropdown-item ${currentPage === item.id ? 'current' : ''}`}
                        onClick={() => {
                          onNavigate(item.id);
                          setActiveSection(null);
                        }}
                        whileHover={{ x: 6 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="item-icon">{item.icon}</span>
                        <div className="item-content">
                          <span className="item-label">{item.label}</span>
                          {item.description && (
                            <span className="item-description">{item.description}</span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}