'use server';

import { spawn } from 'child_process';
export type { Shortcut } from '@/lib/storage';

export interface ShortcutAction {
  type: 'app' | 'url';
  target: string;
  name?: string;
}

// Run macOS open command safely using spawn (avoids shell injection)
function executeOpen(args: string[]): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    // spawn runs "open" without invoking a shell, making it safe against command injection
    const proc = spawn('open', args);

    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, message: 'Shortcut executed successfully' });
      } else {
        const errMsg = stderr.trim() || `Exit code ${code}`;
        resolve({ success: false, message: errMsg });
      }
    });

    proc.on('error', (err) => {
      resolve({ success: false, message: err.message });
    });
  });
}

// Run an osascript (AppleScript) command
function executeAppleScript(script: string): Promise<{ success: boolean; stdout: string }> {
  return new Promise((resolve) => {
    const proc = spawn('osascript', ['-e', script]);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    proc.on('close', (code) => {
      resolve({ success: code === 0, stdout: stdout.trim() });
    });
    proc.on('error', () => resolve({ success: false, stdout: '' }));
  });
}

// Open a URL, focusing an existing tab if the URL is already open in Chrome or Safari
async function openUrl(url: string): Promise<{ success: boolean; message: string }> {
  const script = `
    set targetURL to "${url}"
    set didFocus to false

    -- Try Google Chrome
    try
      tell application "Google Chrome"
        repeat with w in windows
          set tabIndex to 0
          repeat with t in tabs of w
            set tabIndex to tabIndex + 1
            if URL of t starts with targetURL or targetURL starts with URL of t then
              set active tab index of w to tabIndex
              set index of w to 1
              activate
              set didFocus to true
              exit repeat
            end if
          end repeat
          if didFocus then exit repeat
        end repeat
      end tell
    end try

    -- Try Safari if Chrome didn't handle it
    if not didFocus then
      try
        tell application "Safari"
          repeat with w in windows
            set tabIndex to 0
            repeat with t in tabs of w
              set tabIndex to tabIndex + 1
              if URL of t starts with targetURL or targetURL starts with (URL of t) then
                set current tab of w to t
                set index of w to 1
                activate
                set didFocus to true
                exit repeat
              end if
            end repeat
            if didFocus then exit repeat
          end repeat
        end tell
      end try
    end if

    -- If no existing tab found, open it normally
    if not didFocus then
      do shell script "open " & quoted form of targetURL
    end if
  `;

  const result = await executeAppleScript(script);
  if (result.success) {
    return { success: true, message: 'Shortcut executed successfully' };
  }
  // AppleScript failed (e.g. no browser running yet), fall back to plain open
  return await executeOpen([url]);
}

// Server Action to trigger a shortcut on the host Mac
export async function executeShortcut(action: ShortcutAction): Promise<{ success: boolean; message: string }> {
  try {
    if (!action || !action.target) {
      return { success: false, message: 'Target is required' };
    }

    if (action.type === 'app') {
      // open -a "AppName"
      return await executeOpen(['-a', action.target.trim()]);
    } else if (action.type === 'url') {
      // Normalize URL then try to focus existing tab
      let url = action.target.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      return await openUrl(url);
    }

    return { success: false, message: 'Invalid shortcut type' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Server error occurred' };
  }
}

// Alias for backwards-compatibility
export async function openShortcut(actionOrTarget: ShortcutAction | string): Promise<{ success: boolean; message: string }> {
  if (typeof actionOrTarget === 'string') {
    const isUrl = /^https?:\/\//i.test(actionOrTarget) || actionOrTarget.includes('.');
    return executeShortcut({
      type: isUrl ? 'url' : 'app',
      target: actionOrTarget,
    });
  }
  return executeShortcut(actionOrTarget);
}
