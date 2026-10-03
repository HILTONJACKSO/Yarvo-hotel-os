const fs = require('fs');

let pageContent = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');

// Find Navbar
const navStart = pageContent.indexOf('const Navbar = () => {');
const navEnd = pageContent.indexOf('const Hero = () => {');
const navCode = pageContent.substring(navStart, navEnd);

// Find Footer
const footerStart = pageContent.indexOf('const Footer = () => {');
const footerEnd = pageContent.indexOf('export default function LandingPage');
const footerCode = pageContent.substring(footerStart, footerEnd);

const navFile = `
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

${navCode}
export { Navbar };
`;

const footerFile = `
"use client";
import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook } from 'lucide-react';

${footerCode}
export { Footer };
`;

fs.writeFileSync('apps/web/src/components/landing/Navbar.tsx', navFile);
fs.writeFileSync('apps/web/src/components/landing/Footer.tsx', footerFile);

// Remove them from page.tsx and add imports
pageContent = pageContent.substring(0, navStart) + pageContent.substring(navEnd, footerStart) + pageContent.substring(footerEnd);
pageContent = pageContent.replace('import Link from "next/link";', 'import Link from "next/link";\nimport { Navbar } from "../components/landing/Navbar";\nimport { Footer } from "../components/landing/Footer";');

fs.writeFileSync('apps/web/src/app/page.tsx', pageContent);

console.log('Extracted Nav and Footer!');
