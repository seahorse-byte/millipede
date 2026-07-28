"""Kafka consumer: raw-dev-events → enriched-dev-events."""

from __future__ import annotations

import json
import logging
import os
import signal
import sys
from typing import Any

from confluent_kafka import Consumer, KafkaException, Producer

from millipede_llm_worker.graph import enrich_raw_event

LOG = logging.getLogger("millipede_llm_worker")
RUNNING = True


def env(name: str, default: str) -> str:
    return os.environ.get(name, default)


def consumer_config() -> dict[str, Any]:
    return {
        "bootstrap.servers": env("KAFKA_BROKERS", "localhost:9092"),
        "group.id": env("LLM_WORKER_GROUP", "millipede-llm-worker"),
        "auto.offset.reset": "earliest",
        "enable.auto.commit": True,
    }


def producer_config() -> dict[str, Any]:
    return {
        "bootstrap.servers": env("KAFKA_BROKERS", "localhost:9092"),
        "acks": "all",
    }


def handle_shutdown(_signum: int, _frame: object | None) -> None:
    global RUNNING
    RUNNING = False


def process_message(payload: str, producer: Producer, output_topic: str) -> None:
    raw = json.loads(payload)
    enriched = enrich_raw_event(raw)
    producer.produce(
        output_topic,
        key=enriched["id"].encode("utf-8"),
        value=json.dumps(enriched).encode("utf-8"),
    )
    producer.poll(0)
    LOG.info(
        "enriched event_id=%s sentiment=%.3f risk=%.3f",
        enriched["id"],
        enriched["sentiment"],
        enriched["risk_score"],
    )


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    input_topic = env("KAFKA_INPUT_TOPIC", "raw-dev-events")
    output_topic = env("KAFKA_OUTPUT_TOPIC", "enriched-dev-events")

    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)

    consumer = Consumer(consumer_config())
    producer = Producer(producer_config())
    consumer.subscribe([input_topic])

    LOG.info(
        "llm-worker listening input=%s output=%s brokers=%s",
        input_topic,
        output_topic,
        env("KAFKA_BROKERS", "localhost:9092"),
    )

    try:
        while RUNNING:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                raise KafkaException(msg.error())

            try:
                payload = msg.value().decode("utf-8")
                process_message(payload, producer, output_topic)
            except json.JSONDecodeError:
                LOG.warning("skipping invalid json payload")
            except Exception:
                LOG.exception("failed to enrich message")
    finally:
        producer.flush(5)
        consumer.close()
        LOG.info("llm-worker stopped")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
