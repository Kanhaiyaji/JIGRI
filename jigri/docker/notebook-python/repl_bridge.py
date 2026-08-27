#!/usr/bin/env python3
import sys
import json
import io
import traceback
import base64
import subprocess
import types
from contextlib import redirect_stdout, redirect_stderr

namespace = {}

# Mock google.colab to prevent import errors in Colab notebooks
try:
    if 'google' not in sys.modules:
        google_mod = types.ModuleType('google')
        colab_mod = types.ModuleType('google.colab')
        
        class MockDrive:
            @staticmethod
            def mount(*args, **kwargs):
                print("[Info] Google Drive mount skipped in standalone notebook runtime.")
        
        colab_mod.drive = MockDrive()
        colab_mod.files = types.SimpleNamespace()
        google_mod.colab = colab_mod
        sys.modules['google'] = google_mod
        sys.modules['google.colab'] = colab_mod
except Exception:
    pass

def execute_cell(cell_id: str, code: str) -> dict:
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    result_data = None
    result_type = 'text'

    # Preprocess code: handle shell commands (!) and magic commands (%)
    cleaned_lines = []
    for line in code.split('\n'):
        trimmed = line.strip()
        if trimmed.startswith('!'):
            # Execute shell command (e.g., !pip install pandas)
            cmd = trimmed[1:].strip()
            try:
                proc = subprocess.run(
                    cmd,
                    shell=True,
                    text=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                if proc.stdout:
                    stdout_buf.write(proc.stdout)
                if proc.stderr:
                    stderr_buf.write(proc.stderr)
            except Exception as cmd_err:
                stderr_buf.write(f"Shell execution error: {cmd_err}\n")
            continue
        elif trimmed.startswith('%'):
            # Ignore IPython line magics (e.g., %matplotlib inline)
            stdout_buf.write(f"[Magic command skipped]: {trimmed}\n")
            continue
        cleaned_lines.append(line)

    clean_code = '\n'.join(cleaned_lines)

    if clean_code.strip():
        try:
            with redirect_stdout(stdout_buf), redirect_stderr(stderr_buf):
                # Try to get last expression value
                try:
                    import ast
                    tree = ast.parse(clean_code, mode='exec')
                    last_expr = None
                    if tree.body and isinstance(tree.body[-1], ast.Expr):
                        last_node = tree.body.pop()
                        last_expr = ast.Expression(body=last_node.value)
                        ast.fix_missing_locations(last_expr)

                    # Execute all but last
                    exec(compile(tree, '<cell>', 'exec'), namespace)

                    # Evaluate last expression if it exists
                    if last_expr:
                        val = eval(compile(last_expr, '<cell>', 'eval'), namespace)
                        if val is not None:
                            # Check for pandas DataFrame
                            try:
                                import pandas as pd
                                if isinstance(val, pd.DataFrame):
                                    result_type = 'html'
                                    result_data = val.to_html(classes='dataframe', border=0, max_rows=100)
                                elif isinstance(val, pd.Series):
                                    result_type = 'html'
                                    result_data = val.to_frame().to_html(classes='dataframe', border=0, max_rows=100)
                            except ImportError:
                                pass

                            if result_data is None:
                                # Check for matplotlib figure
                                try:
                                    import matplotlib
                                    import matplotlib.pyplot as plt
                                    if isinstance(val, matplotlib.figure.Figure):
                                        buf = io.BytesIO()
                                        val.savefig(buf, format='png', bbox_inches='tight')
                                        buf.seek(0)
                                        result_type = 'image'
                                        result_data = base64.b64encode(buf.read()).decode()
                                        plt.close(val)
                                except ImportError:
                                    pass

                            if result_data is None:
                                result_type = 'text'
                                result_data = repr(val)
                except SyntaxError as e:
                    stderr_buf.write(f'SyntaxError: {e}\n')
        except Exception:
            stderr_buf.write(traceback.format_exc())

    # Check for matplotlib plots generated as side effect
    try:
        import matplotlib.pyplot as plt
        figs = [plt.figure(n) for n in plt.get_fignums()]
        if figs and result_data is None:
            buf = io.BytesIO()
            figs[-1].savefig(buf, format='png', bbox_inches='tight')
            buf.seek(0)
            result_type = 'image'
            result_data = base64.b64encode(buf.read()).decode()
            plt.close('all')
    except Exception:
        pass

    return {
        'id': cell_id,
        'stdout': stdout_buf.getvalue(),
        'stderr': stderr_buf.getvalue(),
        'result': {'type': result_type, 'data': result_data} if result_data is not None else None
    }

if __name__ == '__main__':
    # Signal ready
    sys.stdout.write(json.dumps({'status': 'ready'}) + '\n')
    sys.stdout.flush()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            cmd = json.loads(line)
            response = execute_cell(cmd['id'], cmd['code'])
        except Exception as e:
            response = {'id': 'error', 'stdout': '', 'stderr': str(e), 'result': None}

        sys.stdout.write(json.dumps(response) + '\n')
        sys.stdout.flush()

