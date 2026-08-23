FROM python:3.11-slim
RUN pip install numpy pandas matplotlib seaborn scikit-learn requests pillow scipy sympy tabulate
COPY repl_bridge.py /repl_bridge.py
RUN useradd -m -u 1001 runner
WORKDIR /code
USER runner
CMD ["python3", "/repl_bridge.py"]
