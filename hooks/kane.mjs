#!/usr/bin/env node
// Runs kane-cli with the given arguments, resolved without a shell (see src/kane.mjs).
import { spawn } from 'node:child_process';
import { findKane } from '../src/kane.mjs';

const { cmd, pre } = findKane();
const child = spawn(cmd, [...pre, ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: true });
child.on('close', (code) => process.exit(code ?? 2));
