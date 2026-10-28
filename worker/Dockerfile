FROM node:22-alpine
WORKDIR /app
COPY alert_worker.mjs ./
# Run daily at 09:00 AM via crond
RUN echo "0 9 * * * node /app/alert_worker.mjs >> /var/log/cron.log 2>&1" > /etc/crontabs/root
CMD ["crond", "-f", "-d", "8"]

