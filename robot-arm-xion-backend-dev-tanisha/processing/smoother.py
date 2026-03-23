class DataSmoother:

    def __init__(self, alpha=0.2):
        self.alpha = alpha
        self.prev = None

    def smooth(self, value):

        if self.prev is None:
            self.prev = value
            return value

        smoothed = self.alpha * value + (1 - self.alpha) * self.prev
        self.prev = smoothed

        return smoothed