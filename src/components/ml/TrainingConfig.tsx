import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings2, Play, Loader2 } from 'lucide-react';
import { TrainingConfig as TrainingConfigType, DatasetInfo } from '@/types/ml-training';

interface TrainingConfigProps {
  config: TrainingConfigType;
  onChange: (config: TrainingConfigType) => void;
  onStartTraining: () => void;
  isTraining: boolean;
  selectedDataset: DatasetInfo | null;
}

export const TrainingConfig = ({ 
  config, 
  onChange, 
  onStartTraining, 
  isTraining,
  selectedDataset 
}: TrainingConfigProps) => {
  const updateConfig = <K extends keyof TrainingConfigType>(
    key: K, 
    value: TrainingConfigType[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-accent" />
          Training Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Model Architecture</Label>
            <Select 
              value={config.modelType} 
              onValueChange={(v) => updateConfig('modelType', v as TrainingConfigType['modelType'])}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BERT">BERT (Sentiment Focus)</SelectItem>
                <SelectItem value="LSTM">LSTM (Time Series Focus)</SelectItem>
                <SelectItem value="BERT+LSTM">BERT + LSTM (Hybrid)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Epochs</Label>
            <Input
              type="number"
              value={config.epochs}
              onChange={(e) => updateConfig('epochs', parseInt(e.target.value) || 10)}
              min={1}
              max={100}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Batch Size</Label>
            <Select 
              value={config.batchSize.toString()} 
              onValueChange={(v) => updateConfig('batchSize', parseInt(v))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="32">32</SelectItem>
                <SelectItem value="64">64</SelectItem>
                <SelectItem value="128">128</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Learning Rate: {config.learningRate}</Label>
            <Slider
              value={[config.learningRate * 10000]}
              onValueChange={([v]) => updateConfig('learningRate', v / 10000)}
              min={1}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Validation Split: {(config.validationSplit * 100).toFixed(0)}%</Label>
            <Slider
              value={[config.validationSplit * 100]}
              onValueChange={([v]) => updateConfig('validationSplit', v / 100)}
              min={10}
              max={40}
              step={5}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Sequence Length</Label>
            <Input
              type="number"
              value={config.sequenceLength}
              onChange={(e) => updateConfig('sequenceLength', parseInt(e.target.value) || 60)}
              min={10}
              max={200}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Hidden Units</Label>
            <Select 
              value={config.hiddenUnits.toString()} 
              onValueChange={(v) => updateConfig('hiddenUnits', parseInt(v))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="64">64</SelectItem>
                <SelectItem value="128">128</SelectItem>
                <SelectItem value="256">256</SelectItem>
                <SelectItem value="512">512</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Dropout Rate: {(config.dropoutRate * 100).toFixed(0)}%</Label>
            <Slider
              value={[config.dropoutRate * 100]}
              onValueChange={([v]) => updateConfig('dropoutRate', v / 100)}
              min={0}
              max={50}
              step={5}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Optimizer</Label>
            <Select 
              value={config.optimizer} 
              onValueChange={(v) => updateConfig('optimizer', v as TrainingConfigType['optimizer'])}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adam">Adam</SelectItem>
                <SelectItem value="sgd">SGD</SelectItem>
                <SelectItem value="rmsprop">RMSprop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Early Stopping</Label>
            <Switch
              checked={config.earlyStopping}
              onCheckedChange={(v) => updateConfig('earlyStopping', v)}
            />
          </div>
        </div>

        <Button 
          className="w-full gap-2" 
          size="lg"
          onClick={onStartTraining}
          disabled={isTraining || !selectedDataset}
        >
          {isTraining ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Training in Progress...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start Training
            </>
          )}
        </Button>

        {!selectedDataset && (
          <p className="text-xs text-center text-muted-foreground">
            Select a dataset to start training
          </p>
        )}
      </CardContent>
    </Card>
  );
};
