#!/usr/bin/env python3
import os
import subprocess
import sys
import time
import signal
import atexit

def run_command(command, cwd, env=None):
    """Run a command in a specific directory"""
    return subprocess.Popen(
        command,
        cwd=cwd,
        env={**os.environ, **(env or {})},
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True,
    )

def print_output(process, prefix):
    """Print output from a process with a prefix"""
    while True:
        output = process.stdout.readline()
        if output:
            print(f"{prefix}: {output.strip()}")
        if process.poll() is not None:
            break

def cleanup_processes(processes):
    """Cleanup all running processes"""
    for process in processes:
        if process.poll() is None:  # If process is still running
            process.terminate()
            try:
                process.wait(timeout=5)  # Wait up to 5 seconds for graceful shutdown
            except subprocess.TimeoutExpired:
                process.kill()  # Force kill if process doesn't terminate

def main():
    # Get the root directory
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, 'frontend')
    api_dir = os.path.join(root_dir, 'api')
    
    # Start frontend (Next.js)
    print("Starting frontend server...")
    frontend = run_command('npm run dev', frontend_dir)
    
    # Start backend (Flask)
    print("Starting backend server...")
    backend = run_command(
        'flask run --port 5001',
        api_dir,
        env={
            'FLASK_APP': 'wsgi.py',
            'PYTHONPATH': api_dir
        }
    )
    
    # Register cleanup function
    processes = [frontend, backend]
    atexit.register(cleanup_processes, processes)
    
    try:
        # Monitor both processes
        while True:
            # Check if either process has terminated
            if frontend.poll() is not None:
                print("Frontend server stopped unexpectedly")
                break
            if backend.poll() is not None:
                print("Backend server stopped unexpectedly")
                break
                
            # Print output from both processes
            frontend_output = frontend.stdout.readline()
            if frontend_output:
                print(f"Frontend: {frontend_output.strip()}")
                
            backend_output = backend.stdout.readline()
            if backend_output:
                print(f"Backend: {backend_output.strip()}")
            
            time.sleep(0.1)  # Small delay to prevent CPU hogging
            
    except KeyboardInterrupt:
        print("\nShutting down servers...")
    finally:
        cleanup_processes(processes)

if __name__ == "__main__":
    main()
