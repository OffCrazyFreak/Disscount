package disscount.support;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.IntConsumer;
import java.util.stream.IntStream;

/** Starts every task at one latch, so writes race for real; returns what each failed with. */
public final class Concurrently {

    private Concurrently() {}

    public static List<Throwable> run(int threads, IntConsumer task) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(threads);


        try {
            return failuresOf(submitAll(pool, threads, task));
        } finally {
            // Also on a timeout, so a stuck worker cannot keep the test JVM alive.
            pool.shutdownNow();
        }
    }

    private static List<Future<?>> submitAll(ExecutorService pool, int threads, IntConsumer task) {
        CountDownLatch start = new CountDownLatch(1);

        List<Future<?>> futures = IntStream.range(0, threads).<Future<?>>mapToObj(i -> pool.submit(() -> {
            start.await();
            task.accept(i);
            return null;
        })).toList();

        start.countDown();
        return futures;
    }

    private static List<Throwable> failuresOf(List<Future<?>> futures) throws Exception {
        List<Throwable> failures = new ArrayList<>();
        for (Future<?> future : futures) {
            try {
                future.get(30, TimeUnit.SECONDS);
            } catch (ExecutionException e) {
                failures.add(e.getCause());
            }
        }

        return failures;
    }
}
